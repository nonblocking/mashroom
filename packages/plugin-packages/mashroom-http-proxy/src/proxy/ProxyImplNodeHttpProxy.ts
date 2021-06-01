
import {URLSearchParams} from 'url';
import {createProxyServer} from 'http-proxy';
import shortId from 'shortid';
import {getHttpPool, getHttpsPool, getPoolConfig} from '../connection_pool';

import type {IncomingMessage, ServerResponse, ClientRequest} from 'http';
import type {ParsedQs} from 'qs';
import type {Request, Response} from 'express';
import type {ServerOptions} from 'http-proxy';
import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders} from '../../type-definitions';
import type {Proxy, HttpHeaderFilter, InterceptorHandler} from '../../type-definitions/internal';

type ProxyServer = ReturnType<typeof createProxyServer>;
type ProxyRequest = {
    startTime: [number, number];
    uri: string;
    additionalQueryParams: ParsedQs;
    resolve: () => void;
}
type ProxyRequests = {
    [id: string]: ProxyRequest;
}

const activeRequests: ProxyRequests = {};

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
}

/**
 * A Proxy implementation based on node-http-proxy
 */
export default class ProxyImplNodeHttpProxy implements Proxy {

    private _httpProxy: ProxyServer;
    private _httpsProxy: ProxyServer;

    constructor(private _socketTimeoutMs: number, rejectUnauthorized: boolean, private _interceptorHandler: InterceptorHandler,
                private _headerFilter: HttpHeaderFilter, loggerFactory: MashroomLoggerFactory) {
        const logger = loggerFactory('mashroom.httpProxy');
        const poolConfig = getPoolConfig();
        logger.info(`Initializing http proxy with maxSockets: ${poolConfig.maxSockets} and socket timeout: ${_socketTimeoutMs}ms`);
        this._httpProxy = createProxyServer({
            proxyTimeout: _socketTimeoutMs, // timeout will be set on the proxy request
            agent: getHttpPool(),
            changeOrigin: false,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
            xfwd: true,
        });
        this._httpsProxy = createProxyServer({
            proxyTimeout: _socketTimeoutMs, // timeout will be set on the proxy request
            agent: getHttpsPool(),
            changeOrigin: false,
            secure: rejectUnauthorized,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
            xfwd: true,
        });

        this._httpProxy.on('proxyReq', this.onProxyRequest.bind(this));
        this._httpsProxy.on('proxyReq', this.onProxyRequest.bind(this));
        this._httpProxy.on('proxyRes', this.onProxyResponse.bind(this));
        this._httpsProxy.on('proxyRes', this.onProxyResponse.bind(this));
        this._httpProxy.on('end', this.onEnd.bind(this));
        this._httpsProxy.on('end', this.onEnd.bind(this));
        this._httpProxy.on('error', this.onError.bind(this));
        this._httpsProxy.on('error', this.onError.bind(this));
    }

    async forward(req: Request, res: Response, uri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.httpProxy');

        if (req.headers.upgrade) {
            // TODO: implement
            res.sendStatus(406);
            return Promise.resolve();
        }

        let effectiveTargetUri = encodeURI(uri);
        let effectiveAdditionalHeaders = {
            ...additionalHeaders,
        };
        let effectiveQueryParams = {
            ...req.query
        };
        // Process request interceptors
        const interceptorResult = await this._interceptorHandler.processRequest(req, res, uri, additionalHeaders, logger);
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
        logger.info(`Forwarding ${req.method} request to: ${uri}`);

        const proxyServer = uri.startsWith('https') ? this._httpsProxy : this._httpProxy;
        return new Promise((resolve) => {
            const requestId = shortId();
            req.requestId = requestId;
            activeRequests[requestId] = {
                startTime,
                uri: effectiveTargetUri,
                additionalQueryParams: effectiveQueryParams,
                resolve: () => {
                  delete activeRequests[requestId];
                  resolve();
                }
            };
            proxyServer.web(req, res, {
                target: effectiveTargetUri,
                headers: toSimpleHeaders(effectiveAdditionalHeaders),
                selfHandleResponse: true,
            });
        })
    }

    shutdown(): void {
        this._httpProxy.removeAllListeners();
        this._httpsProxy.removeAllListeners();
        this._httpProxy.close();
        this._httpsProxy.close();
    }

    private async onProxyRequest(proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse, options: ServerOptions): Promise<void> {
        const clientRequest = req as Request;
        const activeRequest = activeRequests[clientRequest.requestId || '_'];
        if (!activeRequest) {
            return;
        }

        // Add query params
        const query = new URLSearchParams();
        Object.keys(activeRequest.additionalQueryParams).forEach((queryParamName) => {
            const value = activeRequest.additionalQueryParams[queryParamName];
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
            proxyReq.path = `${proxyReq.path}?${queryStr}`;
        }
    }

    private async onProxyResponse(proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse): Promise<void> {
        const clientRequest = req as Request;
        const clientResponse = res as Response;
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const activeRequest = activeRequests[clientRequest.requestId || '_'];
        if (!activeRequest) {
            return;
        }

        // Execute response interceptors
        const interceptorResult = await this._interceptorHandler.processResponse(clientRequest, clientResponse, activeRequest.uri, proxyRes, logger);

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

        const endTime = process.hrtime(activeRequest.startTime);
        logger.info(`Response headers received from ${activeRequest.uri} received in ${endTime[0]}s ${endTime[1] / 1000000}ms with status ${proxyRes.statusCode}`);
    }

    private async onEnd(req: IncomingMessage): Promise<void> {
        const clientRequest = req as Request;
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const activeRequest = activeRequests[clientRequest.requestId || '_'];
        if (!activeRequest) {
            return;
        }

        const endTime = process.hrtime(activeRequest.startTime);
        logger.info(`Response from ${activeRequest.uri} sent to client in ${endTime[0]}s ${endTime[1] / 1000000}ms`);

        activeRequest.resolve();
    }

    private async onError(error: NodeJS.ErrnoException, req: IncomingMessage, res: ServerResponse): Promise<void> {
        const clientRequest = req as Request;
        const clientResponse = res as Response;
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const activeRequest = activeRequests[clientRequest.requestId || '_'];
        if (!activeRequest) {
            return;
        }

        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            logger.error(`Target endpoint '${activeRequest.uri}' did not send a response within ${this._socketTimeoutMs}ms!`, error);
            if (!clientResponse.headersSent) {
                clientResponse.sendStatus(504);
            }
        } else {
            logger.error(`Forwarding to '${activeRequest.uri}' failed!`, error);
            if (!clientResponse.headersSent) {
                clientResponse.sendStatus(503);
            }
        }

        activeRequest.resolve();
    }
}

