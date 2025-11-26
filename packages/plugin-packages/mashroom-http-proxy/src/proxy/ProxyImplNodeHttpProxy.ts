import {URLSearchParams, URL} from 'url';
import {createProxyServer} from 'http-proxy';
import {loggingUtils} from '@mashroom/mashroom-utils';
import {getHttpPool, getHttpsPool, getPoolConfig, getWaitingRequestsForHostHeader} from '../connection-pool';
import {createForwardedForHeaders, processHttpResponseInterceptors, processHttpRequestInterceptors, processWsRequestInterceptors} from './utils';

import type {
    RequestMetrics,
    Proxy,
    HttpHeaderFilter,
    InterceptorHandler,
    WSConnectionMetrics,
    ProxyRequestMeta,
} from '../../type-definitions/internal';
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
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {HttpHeaders} from '../../type-definitions';

type ProxyServer = ReturnType<typeof createProxyServer>;

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

    private readonly _globalLogger: MashroomLogger;
    private readonly _httpProxy: ProxyServer;
    private readonly _httpsProxy: ProxyServer;
    private readonly _wsProxy: ProxyServer;
    private readonly _requestMetrics: RequestMetrics;
    private readonly _wsConnectionMetrics: WSConnectionMetrics;

    constructor(private _socketTimeoutMs: number, rejectUnauthorized: boolean, private _interceptorHandler: InterceptorHandler,
                private _headerFilter: HttpHeaderFilter, private _retryOnReset: boolean,
                private _wsMaxConnectionsPerHost: number | null, private _wsMaxConnectionsTotal: number | null,
                private _poolMaxWaitingRequestsPerHost: number | null, private _createForwardedForHeaders: boolean,
                loggerFactory: MashroomLoggerFactory) {
        this._globalLogger = loggerFactory('mashroom.httpProxy');
        const poolConfig = getPoolConfig();
        this._globalLogger.info(`Initializing http proxy with pool config: ${JSON.stringify(poolConfig, null, 2)} and socket timeout: ${_socketTimeoutMs}ms`);
        this._httpProxy = createProxyServer({
            agent: getHttpPool(),
            changeOrigin: true,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
        });
        this._httpsProxy = createProxyServer({
            agent: getHttpsPool(),
            changeOrigin: true,
            secure: rejectUnauthorized,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
        });
        this._wsProxy = createProxyServer({
            changeOrigin: true,
            secure: rejectUnauthorized,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
        });
        this._requestMetrics = {
            httpRequestCountTotal: 0,
            httpRequestTargetCount: {},
            httpConnectionErrorCountTotal: 0,
            httpConnectionErrorTargetCount: {},
            httpTimeoutCountTotal: 0,
            httpTimeoutTargetCount: {},
            wsRequestCountTotal: 0,
            wsRequestTargetCount: {},
            wsConnectionErrorCountTotal: 0,
            wsConnectionErrorTargetCount: {},
        };
        this._wsConnectionMetrics = {
            activeConnections: 0,
            activeConnectionsTargetCount: {},
        };

        this._httpProxy.on('proxyReq', this.onProxyRequest.bind(this));
        this._httpsProxy.on('proxyReq', this.onProxyRequest.bind(this));
        this._httpProxy.on('proxyRes', this.onProxyResponse.bind(this));
        this._httpsProxy.on('proxyRes', this.onProxyResponse.bind(this));
        this._httpProxy.on('end', this.onEnd.bind(this));
        this._httpsProxy.on('end', this.onEnd.bind(this));
        this._httpProxy.on('error', this.onError.bind(this));
        this._httpsProxy.on('error', this.onError.bind(this));
        this._wsProxy.on('proxyReqWs', this.onWsProxyRequest.bind(this));
        this._wsProxy.on('open', this.onWsOpen.bind(this));
        this._wsProxy.on('close', this.onWsClose.bind(this));
        this._wsProxy.on('error', this.onWsError.bind(this));
    }

    async forward(req: Request, res: Response, targetUri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.httpProxy');

        // Process interceptors
        const {responseHandled, effectiveTargetUri, effectiveAdditionalHeaders, effectiveQueryParams, streamTransformers} =
            await processHttpRequestInterceptors(req, res, targetUri, additionalHeaders, this._interceptorHandler, logger);

        if (responseHandled) {
            return;
        }

        if (streamTransformers?.length > 0) {
            logger.error('Stream transformer added by interceptor, but this proxy does not support transforming the request body');
        }

        // Extra checks
        const {protocol, host} = new URL(effectiveTargetUri);
        if (protocol !== 'http:' && protocol !== 'https:') {
            logger.error(`Cannot forward to ${effectiveTargetUri} because the protocol is not supported (only HTTP and HTTPS)`);
            res.sendStatus(502);
            return;
        }
        if (typeof this._poolMaxWaitingRequestsPerHost === 'number' && this._poolMaxWaitingRequestsPerHost > 0) {
            if (getWaitingRequestsForHostHeader(protocol, host) >= this._poolMaxWaitingRequestsPerHost) {
                logger.error(`Cannot forward to ${effectiveTargetUri} because max waiting requests per host reached (${this._poolMaxWaitingRequestsPerHost})`);
                res.sendStatus(429);
                return;
            }
        }

        // Metrics
        this._requestMetrics.httpRequestCountTotal ++;
        const target = `${protocol}//${host}`;
        if (!this._requestMetrics.httpRequestTargetCount[target]) {
            this._requestMetrics.httpRequestTargetCount[target] = 0;
        }
        this._requestMetrics.httpRequestTargetCount[target] ++;

        let forwardedForHeaders = {};
        if (this._createForwardedForHeaders) {
            forwardedForHeaders = createForwardedForHeaders(req);
        }

        // Filter the headers from the incoming request
        this._headerFilter.removeUnwantedHeaders(req.headers);

        const startTime = process.hrtime();
        logger.info(`Forwarding ${req.method} request to: ${effectiveTargetUri}`);

        const proxyServer = effectiveTargetUri.startsWith('https') ? this._httpsProxy : this._httpProxy;
        return new Promise((resolve) => {
            const forward = () => {
                proxyServer.web(req, res, {
                    target: effectiveTargetUri,
                    headers: {
                        ...toSimpleHeaders(effectiveAdditionalHeaders),
                        ...forwardedForHeaders,
                    },
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

        // Process interceptors
        const {effectiveTargetUri, effectiveAdditionalHeaders} = await processWsRequestInterceptors(req, targetUri, additionalHeaders, this._interceptorHandler, logger);

        const {protocol, host} = new URL(effectiveTargetUri);
        if (protocol !== 'ws:' && protocol !== 'wss:') {
            logger.error(`Cannot forward to ${effectiveTargetUri} because the protocol is not supported`);
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n', 'ascii');
            return;
        }

        if (typeof this._wsMaxConnectionsTotal === 'number' && this._wsConnectionMetrics.activeConnections >= this._wsMaxConnectionsTotal) {
            logger.error(`Cannot forward to ${effectiveTargetUri} because max total connections reached (${this._wsMaxConnectionsTotal})`);
            socket.end('HTTP/1.1 429 Too Many Requests\r\n\r\n', 'ascii');
            return;
        }
        if (typeof this._wsMaxConnectionsPerHost === 'number' && this.getActiveWSConnectionsToHost(effectiveTargetUri) >= this._wsMaxConnectionsPerHost) {
            logger.error(`Cannot forward to ${effectiveTargetUri} because max total connections per host reached (${this._wsMaxConnectionsPerHost})`);
            socket.end('HTTP/1.1 429 Too Many Requests\r\n\r\n', 'ascii');
            return;
        }

        if (req.headers.upgrade !== 'websocket') {
            throw new Error(`Upgrade not supported: ${req.headers.upgrade}`);
        }

        // Metrics
        this._requestMetrics.wsRequestCountTotal ++;
        const target = `${protocol}//${host}`;
        if (!this._requestMetrics.wsRequestTargetCount[target]) {
            this._requestMetrics.wsRequestTargetCount[target] = 0;
        }
        this._requestMetrics.wsRequestTargetCount[target] ++;

        let forwardedForHeaders = {};
        if (this._createForwardedForHeaders) {
            forwardedForHeaders = createForwardedForHeaders(req);
        }

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

        this._wsProxy.ws(req, socket, head, {
            target: effectiveTargetUri,
            headers: {
                ...toSimpleHeaders(effectiveAdditionalHeaders),
                ...forwardedForHeaders,
            },
        });
    }

    shutdown(): void {
        this._httpProxy.removeAllListeners();
        this._httpsProxy.removeAllListeners();
        this._wsProxy.removeAllListeners();
        this._httpProxy.close();
        this._httpsProxy.close();
        this._wsProxy.close();
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

        res.on('close', () => {
            requestMeta.end();
            const aborted = !res.writableFinished;
            if (aborted) {
                logger.info(`Request aborted by client: '${requestMeta.uri}'`);
                // Make sure to also abort the proxy request to prevent a memory leak
                // See https://github.com/http-party/node-http-proxy/issues/1586
                proxyReq.destroy();
            }
        });

        // Proper timeout handling
        proxyReq.setTimeout(this._socketTimeoutMs, () => {
            logger.error(`Target endpoint '${requestMeta.uri}' did not send a response within ${this._socketTimeoutMs}ms!`);
            const target = this.getProtocolAndHost(requestMeta.uri);
            this._requestMetrics.httpTimeoutCountTotal ++;
            if (!this._requestMetrics.httpTimeoutTargetCount[target]) {
                this._requestMetrics.httpTimeoutTargetCount[target] = 0;
            }
            this._requestMetrics.httpTimeoutTargetCount[target] ++;
            requestMeta.end();
            // Abort proxy request
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

        // Process interceptors
        const {responseHandled, streamTransformers} = await processHttpResponseInterceptors(clientRequest, clientResponse, requestMeta.uri, proxyRes, this._interceptorHandler, logger);

        if (responseHandled) {
            return;
        }

        if (streamTransformers?.length > 0) {
            logger.error('Stream transformer added by interceptor, but this proxy does not support transforming the response body');
        }

        // Filter the headers from the target response
        this._headerFilter.removeUnwantedHeaders(proxyRes.headers);

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

        if (requestMeta?.type !== 'HTTP') {
            return;
        }

        const target = this.getProtocolAndHost(requestMeta.uri);

        if (!clientResponse.headersSent && error.code === 'ECONNRESET') {
            if (this._retryOnReset && requestMeta.retries < MAX_RETRIES) {
                logger.warn(`Retrying HTTP request to '${requestMeta.uri}' because target did not accept or drop the connection (retry #${requestMeta.retries + 1})`);
                requestMeta.retry();
                return;
            } else {
                logger.error(`Forwarding HTTP request to '${requestMeta.uri}' failed! Target did not accept the connection after ${requestMeta.retries + 1} attempt(s)`, error);
                if (!clientResponse.headersSent) {
                    clientResponse.sendStatus(502);
                }
            }
        } else {
            logger.error(`Forwarding HTTP request to '${requestMeta.uri}' failed!`, error);
            if (!clientResponse.headersSent) {
                clientResponse.sendStatus(502);
            }
        }
        this._requestMetrics.httpConnectionErrorCountTotal ++;
        if (!this._requestMetrics.httpConnectionErrorTargetCount[target]) {
            this._requestMetrics.httpConnectionErrorTargetCount[target] = 0;
        }
        this._requestMetrics.httpConnectionErrorTargetCount[target] ++;

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

        this._wsConnectionMetrics.activeConnections ++;
        const target = this.getProtocolAndHost(requestMeta.uri);
        if (!this._wsConnectionMetrics.activeConnectionsTargetCount[target]) {
            this._wsConnectionMetrics.activeConnectionsTargetCount[target] = 0;
        }
        this._wsConnectionMetrics.activeConnectionsTargetCount[target] ++;

        const logger = this._globalLogger.withContext(loggingUtils.userContext(requestMeta.user));
        logger.info(`WebSocket connection for ${requestMeta.uri} established:`, proxySocket.address());
    }

    private onWsClose(req: IncomingMessage, proxySocket: Socket) {
        const requestMeta = (proxySocket as any)[REQUEST_META_PROP];
        if (!requestMeta || requestMeta.type !== 'WS') {
            return;
        }

        this._wsConnectionMetrics.activeConnections --;
        const target = this.getProtocolAndHost(requestMeta.uri);
        if (this._wsConnectionMetrics.activeConnectionsTargetCount[target]) {
            this._wsConnectionMetrics.activeConnectionsTargetCount[target] --;
            if (this._wsConnectionMetrics.activeConnectionsTargetCount[target] === 0) {
                delete this._wsConnectionMetrics.activeConnectionsTargetCount[target];
            }
        }

        const logger = this._globalLogger.withContext(loggingUtils.userContext(requestMeta.user));
        logger.info(`WebSocket connection for ${requestMeta.uri} closed`);
        requestMeta.end();
    }

    private async onWsError(error: NodeJS.ErrnoException, req: IncomingMessage, res: ServerResponse | Socket): Promise<void> {
        const clientRequest = req as Request;
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const requestMeta = clientRequest[REQUEST_META_PROP];

        if (requestMeta?.type !== 'WS') {
            return;
        }

        const target = this.getProtocolAndHost(requestMeta.uri);

        logger.error(`Forwarding WebSocket request to '${requestMeta.uri}' failed!`, error);
        (res as Socket).end('HTTP/1.1 502 Bad Gateway\r\n\r\n', 'ascii');
        this._requestMetrics.wsConnectionErrorCountTotal ++;
        if (!this._requestMetrics.wsConnectionErrorTargetCount[target]) {
            this._requestMetrics.wsConnectionErrorTargetCount[target] = 0;
        }
        this._requestMetrics.wsConnectionErrorTargetCount[target] ++;

        requestMeta.end();
    }


    private getActiveWSConnectionsToHost(uri: string) {
        const {host} = new URL(uri);
        const wsTarget = `ws://${host}`;
        const wssTarget = `wss://${host}`;
        let count = 0;
        if (this._wsConnectionMetrics.activeConnectionsTargetCount[wsTarget]) {
            count += this._wsConnectionMetrics.activeConnectionsTargetCount[wsTarget];
        }
        if (this._wsConnectionMetrics.activeConnectionsTargetCount[wssTarget]) {
            count += this._wsConnectionMetrics.activeConnectionsTargetCount[wssTarget];
        }
        return count;
    }

    private getProtocolAndHost(uri: string) {
        const {protocol, host} = new URL(uri);
        return `${protocol}//${host}`;
    }

    getRequestMetrics(): RequestMetrics {
        return this._requestMetrics;
    }

    getWSConnectionMetrics(): WSConnectionMetrics | null {
        return this._wsConnectionMetrics;
    }
}

