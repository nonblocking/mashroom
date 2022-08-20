import {URLSearchParams} from 'url';

import {createProxyServer} from 'http-proxy';
import {userContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import {getHttpPool, getHttpsPool, getPoolConfig} from '../connection_pool';

import type {RequestMetrics, Proxy, HttpHeaderFilter, InterceptorHandler} from '../../type-definitions/internal';
import type {IncomingMessage, ServerResponse, ClientRequest} from 'http';
import type {Socket} from 'net';
import type {ParsedQs} from 'qs';
import type {Request, Response} from 'express';
import type {ServerOptions} from 'http-proxy';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    IncomingMessageWithContext
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityUser, MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {HttpHeaders} from '../../type-definitions';

type ProxyServer = ReturnType<typeof createProxyServer>;

type ProxyRequestMeta = {
    readonly startTime: [number, number];
    readonly uri: string;
    readonly additionalQueryParams: ParsedQs;
    readonly type: 'HTTP' | 'WS';
    readonly user: MashroomSecurityUser | undefined | null;
    retries: number;
    readonly retry: () => void;
    readonly end: () => void;
}

const REQUEST_META_PROP = 'mashroomRequestMeta';
const MAX_RETRIES = 2;

const toSimpleHeaders = (httpHeaders: HttpHeaders): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.keys(httpHeaders).forEach((headerKey) => {
        const value = httpHeaders[headerKey];
        if (Array.isArray(value)) {
            value.forEach((val) => {
                result[headerKey] = val;
            });
        } else if (value) {
            result[headerKey] = value;
        }
    });

    return result;
};

/**
 * A Proxy implementation based on node-http-proxy
 */
export default class ProxyImplNodeHttpProxy implements Proxy {

    private _globalLogger: MashroomLogger;
    private _httpProxy: ProxyServer;
    private _httpsProxy: ProxyServer;
    private _metrics: RequestMetrics;

    constructor(private _socketTimeoutMs: number, rejectUnauthorized: boolean, private _interceptorHandler: InterceptorHandler,
                private _headerFilter: HttpHeaderFilter, private _retryOnReset: boolean, loggerFactory: MashroomLoggerFactory) {
        this._globalLogger = loggerFactory('mashroom.httpProxy');
        const poolConfig = getPoolConfig();
        this._globalLogger.info(`Initializing http proxy with maxSockets: ${poolConfig.maxSockets} and socket timeout: ${_socketTimeoutMs}ms`);
        this._httpProxy = createProxyServer({
            agent: getHttpPool(),
            changeOrigin: true,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
            xfwd: true,
        });
        this._httpsProxy = createProxyServer({
            agent: getHttpsPool(),
            changeOrigin: true,
            secure: rejectUnauthorized,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
            xfwd: true,
        });
        this._metrics = {
            httpRequests: 0,
            wsRequests: 0,
            targetConnectionErrors: 0,
            targetTimeouts: 0
        };

        this._httpProxy.on('proxyReq', this.onProxyRequest.bind(this));
        this._httpsProxy.on('proxyReq', this.onProxyRequest.bind(this));
        this._httpProxy.on('proxyRes', this.onProxyResponse.bind(this));
        this._httpsProxy.on('proxyRes', this.onProxyResponse.bind(this));
        this._httpProxy.on('end', this.onEnd.bind(this));
        this._httpsProxy.on('end', this.onEnd.bind(this));
        this._httpProxy.on('error', this.onError.bind(this));
        this._httpsProxy.on('error', this.onError.bind(this));
        this._httpProxy.on('proxyReqWs', this.onWsProxyRequest.bind(this));
        this._httpsProxy.on('proxyReqWs', this.onWsProxyRequest.bind(this));
        this._httpProxy.on('open', this.onWsOpen.bind(this));
        this._httpsProxy.on('open', this.onWsOpen.bind(this));
        this._httpProxy.on('close', this.onWsClose.bind(this));
        this._httpsProxy.on('close', this.onWsClose.bind(this));
    }

    async forward(req: Request, res: Response, targetUri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.httpProxy');
        this._metrics.httpRequests++;

        let effectiveTargetUri = encodeURI(targetUri);
        let effectiveAdditionalHeaders = {
            ...additionalHeaders,
        };
        let effectiveQueryParams = {
            ...req.query
        };

        // Process request interceptors
        const interceptorResult = await this._interceptorHandler.processHttpRequest(req, res, targetUri, additionalHeaders, logger);
        if (interceptorResult.responseHandled) {
            return Promise.resolve();
        }
        if (interceptorResult.rewrittenTargetUri) {
            effectiveTargetUri = encodeURI(interceptorResult.rewrittenTargetUri);
        }
        if (interceptorResult.addHeaders) {
            effectiveAdditionalHeaders = {
                ...effectiveAdditionalHeaders,
                ...interceptorResult.addHeaders,
            };
        }
        if (interceptorResult.removeHeaders) {
            interceptorResult.removeHeaders.forEach((headerKey) => {
                delete effectiveAdditionalHeaders[headerKey];
                delete req.headers[headerKey];
            });
        }
        if (interceptorResult.addQueryParams) {
            effectiveQueryParams = {
                ...effectiveQueryParams,
                ...interceptorResult.addQueryParams,
            };
        }
        if (interceptorResult.removeQueryParams) {
            interceptorResult.removeQueryParams.forEach((paramKey) => {
                delete effectiveQueryParams[paramKey];
            });
        }

        // Filter the forwarded headers from the incoming request
        this._headerFilter.filter(req.headers);

        const startTime = process.hrtime();
        logger.info(`Forwarding ${req.method} request to: ${targetUri}`);

        const proxyServer = targetUri.startsWith('https') ? this._httpsProxy : this._httpProxy;
        return new Promise((resolve) => {
            const forward = () => {
                proxyServer.web(req, res, {
                    target: effectiveTargetUri,
                    headers: toSimpleHeaders(effectiveAdditionalHeaders),
                    selfHandleResponse: true,
                });
            };
            const requestMeta: ProxyRequestMeta = {
                startTime,
                uri: effectiveTargetUri,
                additionalQueryParams: effectiveQueryParams,
                user: null,
                type: 'HTTP',
                retries: 0,
                retry: () => {
                    requestMeta.retries ++;
                    forward();
                },
                end: () => {
                    delete req[REQUEST_META_PROP];
                    resolve();
                }
            };
            req[REQUEST_META_PROP] = requestMeta;
            forward();
        });
    }

    async forwardWs(req: IncomingMessageWithContext, socket: Socket, head: Buffer, targetUri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.httpProxy');
        const securityService: MashroomSecurityService | undefined = req.pluginContext.services.security?.service;
        this._metrics.wsRequests++;

        if (req.headers.upgrade !== 'websocket') {
            throw new Error(`Upgrade not supported: ${req.headers.upgrade}`);
        }

        let effectiveTargetUri = encodeURI(targetUri);
        let effectiveAdditionalHeaders = {
            ...additionalHeaders,
        };

        // Process request interceptors
        const interceptorResult = await this._interceptorHandler.processWsRequest(req, targetUri, additionalHeaders, logger);
        if (interceptorResult.rewrittenTargetUri) {
            effectiveTargetUri = encodeURI(interceptorResult.rewrittenTargetUri);
        }
        if (interceptorResult.addHeaders) {
            effectiveAdditionalHeaders = {
                ...effectiveAdditionalHeaders,
                ...interceptorResult.addHeaders,
            };
        }
        if (interceptorResult.removeHeaders) {
            interceptorResult.removeHeaders.forEach((headerKey) => {
                delete effectiveAdditionalHeaders[headerKey];
                delete req.headers[headerKey];
            });
        }

        const proxyServer = effectiveTargetUri.startsWith('wss') || effectiveTargetUri.startsWith('https') ? this._httpsProxy : this._httpProxy;

        const startTime = process.hrtime();
        logger.info(`Forwarding WebSocket request to: ${effectiveTargetUri}`);
        const requestMeta: ProxyRequestMeta = {
            startTime,
            uri: effectiveTargetUri,
            additionalQueryParams: {},
            user: securityService?.getUser(req as Request),
            type: 'WS',
            retries: -1,
            retry: () => {
                throw new Error('Retry not supported!');
            },
            end: () => { /* nothing to do */}
        };
        (req as any)[REQUEST_META_PROP] = requestMeta;

        proxyServer.ws(req, socket, head, {
            target: effectiveTargetUri,
            headers: toSimpleHeaders({
                ...effectiveAdditionalHeaders
            }),
            autoRewrite: true,
        });
    }

    shutdown(): void {
        this._httpProxy.removeAllListeners();
        this._httpsProxy.removeAllListeners();
        this._httpProxy.close();
        this._httpsProxy.close();
    }

    private async onProxyRequest(proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse, options: ServerOptions): Promise<void> {
        const clientRequest = req as Request;
        const clientResponse = res as Response;
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const requestMeta = clientRequest[REQUEST_META_PROP];
        if (!requestMeta || requestMeta.type !== 'HTTP') {
            return;
        }

        // Add query params
        const query = new URLSearchParams();
        Object.keys(requestMeta.additionalQueryParams).forEach((queryParamName) => {
            const value = requestMeta.additionalQueryParams[queryParamName];
            if (Array.isArray(value)) {
                value.forEach((val: string | ParsedQs) => {
                    query.append(queryParamName, val.toString());
                });
            } else if (value) {
                query.append(queryParamName, value.toString());
            }
        });

        const queryStr = query.toString();
        if (queryStr) {
            if (proxyReq.path.indexOf('?') === -1) {
                proxyReq.path = `${proxyReq.path}?${queryStr}`;
            } else {
                proxyReq.path = `${proxyReq.path}&${queryStr}`;
            }
        }

        // Handle client close event to prevent a memory leak, see https://github.com/http-party/node-http-proxy/issues/1586
        res.on('close', () => {
            logger.info(`Connection closed by client for request '${requestMeta.uri}'`);
            requestMeta.end();
            clientResponse.destroy();
            proxyReq.destroy();
        });

        // Proper timeout handling
        proxyReq.setTimeout(this._socketTimeoutMs, () => {
            logger.error(`Target endpoint '${requestMeta.uri}' did not send a response within ${this._socketTimeoutMs}ms!`);
            this._metrics.targetTimeouts++;
            requestMeta.end();
            proxyReq.destroy();
            if (!clientResponse.headersSent) {
                clientResponse.sendStatus(504);
            }
        });
    }

    private async onProxyResponse(proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse): Promise<void> {
        const clientRequest = req as Request;
        const clientResponse = res as Response;
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const requestMeta = clientRequest[REQUEST_META_PROP];
        if (!requestMeta || requestMeta.type !== 'HTTP') {
            return;
        }

        // Execute response interceptors
        const interceptorResult = await this._interceptorHandler.processHttpResponse(clientRequest, clientResponse, requestMeta.uri, proxyRes, logger);

        if (interceptorResult.responseHandled) {
            return;
        }
        // First filter the headers from the target response
        this._headerFilter.filter(proxyRes.headers);
        if (interceptorResult.addHeaders) {
            Object.keys(interceptorResult.addHeaders).forEach((headerKey) => {
                proxyRes.headers[headerKey] = interceptorResult.addHeaders?.[headerKey];
            });
        }
        if (interceptorResult.removeHeaders) {
            interceptorResult.removeHeaders.forEach((headerKey) => {
                delete proxyRes.headers[headerKey];
            });
        }

        // Send response
        clientResponse.status(proxyRes.statusCode || 0);
        Object.keys(proxyRes.headers).forEach((headerKey) => {
            res.setHeader(headerKey, proxyRes.headers[headerKey] as string | Array<string>);
        });
        proxyRes.pipe(res);

        const endTime = process.hrtime(requestMeta.startTime);
        logger.info(`Response headers received from ${requestMeta.uri} received in ${endTime[0]}s ${endTime[1] / 1000000}ms with status ${proxyRes.statusCode}`);
    }

    private async onEnd(req: IncomingMessage): Promise<void> {
        const clientRequest = req as Request;
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const requestMeta = clientRequest[REQUEST_META_PROP];
        if (!requestMeta || requestMeta.type !== 'HTTP') {
            return;
        }

        const endTime = process.hrtime(requestMeta.startTime);
        logger.info(`Response from ${requestMeta.uri} sent to client in ${endTime[0]}s ${endTime[1] / 1000000}ms`);

        requestMeta.end();
    }

    private async onError(error: NodeJS.ErrnoException, req: IncomingMessage, res: ServerResponse | Socket): Promise<void> {
        const clientRequest = req as Request;
        const clientResponse = res as Response;
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const requestMeta = clientRequest[REQUEST_META_PROP];

        if (!requestMeta) {
            return;
        }

        // node-http-proxy throws an error if the client has aborted, we don't want to log it
        if (!req.aborted) {
            this._metrics.targetConnectionErrors++;

            if (requestMeta.type === 'HTTP') {
                if (!clientResponse.headersSent && error.code === 'ECONNRESET') {
                    if (this._retryOnReset && requestMeta.retries < MAX_RETRIES) {
                        logger.warn(`Retrying HTTP request to '${requestMeta.uri}' because target did not accept or drop the connection (retry #${requestMeta.retries + 1})`);
                        requestMeta.retry();
                        return;
                    } else {
                        logger.error(`Forwarding HTTP request to '${requestMeta.uri}' failed! Target did not accept the connection after ${requestMeta.retries + 1} attempt(s)`, error);
                        clientResponse.sendStatus(503);
                    }
                } else {
                    logger.error(`Forwarding HTTP request to '${requestMeta.uri}' failed!`, error);
                    if (!clientResponse.headersSent) {
                        clientResponse.sendStatus(503);
                    }
                }
            } else if (requestMeta.type === 'WS') {
                logger.error(`Forwarding WebSocket request to '${requestMeta.uri}' failed!`, error);
                (res as Socket).end(`HTTP/1.1 503 Service Unavailable\r\n\r\n`, 'ascii');
            }
        }

        requestMeta.end();
    }

    private onWsProxyRequest(proxyReq: ClientRequest, req: IncomingMessage, socket: Socket) {
        const logger = (req as IncomingMessageWithContext).pluginContext.loggerFactory('mashroom.httpProxy');
        const requestMeta = (req as any)[REQUEST_META_PROP];
        if (!requestMeta || requestMeta.type !== 'WS') {
            return;
        }

        socket.on('error', (error) => {
            logger.error(`WebSocket proxy socket error`, error);
        });

        // Get the proxy socket to copy the request metadata
        proxyReq.on('upgrade', (proxyRes, proxySocket) => {
            (proxySocket as any)[REQUEST_META_PROP] = requestMeta;
        });
        proxyReq.on('response', (proxyRes) => {
            if (proxyRes.statusCode !== 101) {
                logger.error(`Forwarding WebSocket request to '${requestMeta.uri}' failed! Status:`, proxyRes.statusCode);
            }
        });
    }

    private onWsOpen(proxySocket: Socket) {
        const requestMeta = (proxySocket as any)[REQUEST_META_PROP];
        if (!requestMeta || requestMeta.type !== 'WS') {
            return;
        }

        const logger = this._globalLogger.withContext(userContext(requestMeta.user));
        logger.info(`WebSocket connection for ${requestMeta.uri} established:`, proxySocket.address());
    }

    private onWsClose(req: IncomingMessage, proxySocket: Socket) {
        const requestMeta = (proxySocket as any)[REQUEST_META_PROP];
        if (!requestMeta || requestMeta.type !== 'WS') {
            return;
        }

        const logger = this._globalLogger.withContext(userContext(requestMeta.user));
        logger.info(`WebSocket connection for ${requestMeta.uri} closed`);
        requestMeta.end();
    }

    getRequestMetrics(): RequestMetrics {
        return this._metrics;
    }
}

