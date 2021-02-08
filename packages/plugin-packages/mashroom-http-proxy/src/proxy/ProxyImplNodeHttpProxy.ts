import {createProxyServer} from 'http-proxy';
import shortId from 'shortid';
import {getHttpPool, getHttpsPool, getPoolConfig} from '../connection_pool';

import type {IncomingMessage, ServerResponse, ClientRequest} from 'http';
import type {ServerOptions} from 'http-proxy';
import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLoggerFactory,
    MashroomLogger
} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders} from '../../type-definitions';
import type {Proxy, HttpHeaderFilter, InterceptorHandler} from '../../type-definitions/internal';

type ProxyServer = ReturnType<typeof createProxyServer>;
type ExpressRequestWithId = ExpressRequest & { requestId?: string };
type ProxyRequest = {
    startTime: [number, number];
    uri: string;
    resolve: () => void;
}
type ProxyRequests = {
    [id: string]: ProxyRequest;
}

const activeRequests: ProxyRequests = {};

/**
 * A Proxy implementation based on node-http-proxy
 */
export default class ProxyImplNodeHttpProxy implements Proxy {

    httpProxy: ProxyServer;
    httpsProxy: ProxyServer;

    constructor(private socketTimeoutMs: number, rejectUnauthorized: boolean, private interceptorHandler: InterceptorHandler, private headerFilter: HttpHeaderFilter, loggerFactory: MashroomLoggerFactory) {
        const logger: MashroomLogger = loggerFactory('mashroom.httpProxy');
        const poolConfig = getPoolConfig();
        logger.info(`Initializing http proxy with maxSockets: ${poolConfig.maxSockets} and socket timeout: ${socketTimeoutMs}ms`);
        this.httpProxy = createProxyServer({
            proxyTimeout: socketTimeoutMs, // timeout will be set on the proxy request
            agent: getHttpPool(),
            changeOrigin: false,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
            xfwd: true,
        });
        this.httpsProxy = createProxyServer({
            proxyTimeout: socketTimeoutMs, // timeout will be set on the proxy request
            agent: getHttpsPool(),
            changeOrigin: false,
            secure: rejectUnauthorized,
            followRedirects: false,
            ignorePath: true, // do not append req.url path
            xfwd: true,
        });

        this.httpProxy.on('proxyReq', this.onProxyRequest);
        this.httpsProxy.on('proxyReq', this.onProxyRequest);
        this.httpProxy.on('proxyRes', this.onProxyResponse);
        this.httpsProxy.on('proxyRes', this.onProxyResponse);
        this.httpProxy.on('end', this.onEnd);
        this.httpsProxy.on('end', this.onEnd);
        this.httpProxy.on('error', this.onError);
        this.httpsProxy.on('error', this.onError);
    }

    forward(req: ExpressRequest, res: ExpressResponse, uri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.httpProxy');
        const proxiedRequest = req as ExpressRequestWithId;

        if (req.headers.upgrade) {
            // TODO: implement
            res.sendStatus(406);
            return Promise.resolve();
        }

        const headers: Record<string, string> = {};
        Object.keys(additionalHeaders).forEach((headerKey) => {
            const headerValue = additionalHeaders[headerKey];
            if (typeof (headerValue) === 'string') {
                headers[headerKey] = headerValue;
            }
        });

        const startTime = process.hrtime();
        logger.info(`Forwarding ${req.method} request to: ${uri}`);

        const proxyServer = uri.startsWith('https') ? this.httpsProxy : this.httpProxy;
        return new Promise((resolve) => {
            const requestId = shortId();
            proxiedRequest.requestId = requestId;
            activeRequests[requestId] = {
                startTime,
                uri,
                resolve: () => {
                  delete activeRequests[requestId];
                  resolve();
                }
            };
            proxyServer.web(req, res, {
                target: uri,
                headers,
                selfHandleResponse: false,
            });
        })
    }

    shutdown(): void {
        this.httpProxy.close();
        this.httpsProxy.close();
    }

    private async onProxyRequest(proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse, options: ServerOptions): Promise<void> {
        const clientRequest = req as ExpressRequestWithId;
        const clientResponse = res as ExpressResponse;
        const activeRequest = activeRequests[clientRequest.requestId || '_'];
        if (!activeRequest) {
            return;
        }

        // TODO: filter headers
        // TODO: process interceptors

        /*
        parsed = url.parse(proxyReq.path, true);
        parsed.query['limit'] = 2
        updated_path = url.format({pathname: parsed.pathname, query: parsed.query});
        proxyReq.path = updated_path
       */
    }

    private async onProxyResponse(proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse): Promise<void> {
        const clientRequest = req as ExpressRequestWithId;
        const clientResponse = res as ExpressResponse;
        const logger: MashroomLogger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const activeRequest = activeRequests[clientRequest.requestId || '_'];
        if (!activeRequest) {
            return;
        }

        // TODO: filter headers
        // TODO: process interceptors

        const endTime = process.hrtime(activeRequest.startTime);
        logger.info(`Response headers received from ${activeRequest.uri} received in ${endTime[0]}s ${endTime[1] / 1000000}ms with status ${proxyRes.statusCode}`);
    }

    private async onEnd(req: IncomingMessage, res: ServerResponse, proxyRes: IncomingMessage): Promise<void> {
        const clientRequest = req as ExpressRequestWithId;
        const logger: MashroomLogger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const activeRequest = activeRequests[clientRequest.requestId || '_'];
        if (!activeRequest) {
            return;
        }

        const endTime = process.hrtime(activeRequest.startTime);
        logger.info(`Response from ${activeRequest.uri} sent to client in ${endTime[0]}s ${endTime[1] / 1000000}ms`);

        activeRequest.resolve();
    }

    private async onError(error: Error & { code?: string }, req: IncomingMessage, res: ServerResponse): Promise<void> {
        const clientRequest = req as ExpressRequestWithId;
        const clientResponse = res as ExpressResponse;
        const logger: MashroomLogger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy');
        const activeRequest = activeRequests[clientRequest.requestId || '_'];
        if (!activeRequest) {
            return;
        }

        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.code === 'ECONNRESET') {
            logger.error(`Target endpoint '${activeRequest.uri}' did not send a response within ${this.socketTimeoutMs}ms!`, error);
            clientResponse.sendStatus(504);
        } else {
            logger.error(`Forwarding to '${activeRequest.uri}' failed!`, error);
            clientResponse.sendStatus(503);
        }

        activeRequest.resolve();
    }
}

