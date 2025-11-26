import {URLSearchParams, URL} from 'url';
import http from 'http';
import https from 'https';
import {pipeline} from 'stream/promises';
import {getHttpPool, getHttpsPool, getPoolConfig, getWaitingRequestsForHostHeader} from '../connection-pool';
import {createForwardedForHeaders, processHttpResponseInterceptors, processHttpRequestInterceptors, processWsRequestInterceptors} from './utils';
import type {Transform} from 'stream';

import type {
    RequestMetrics,
    Proxy,
    HttpHeaderFilter,
    InterceptorHandler,
    WSConnectionMetrics,
} from '../../type-definitions/internal';
import type {IncomingMessage, ClientRequest} from 'http';
import type {Socket} from 'net';
import type {ParsedQs} from 'qs';
import type {Request, Response} from 'express';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    IncomingMessageWithContext
} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders} from '../../type-definitions';

const MAX_RETRIES = 2;

/**
 * A Proxy implementation based on the Node.js Stream API
 */
export default class ProxyImplNodeStreamAPI implements Proxy {

    private readonly _requestMetrics: RequestMetrics;
    private readonly _wsConnectionMetrics: WSConnectionMetrics;

    constructor(private _socketTimeoutMs: number, private _rejectUnauthorized: boolean, private _interceptorHandler: InterceptorHandler,
                private _headerFilter: HttpHeaderFilter, private _retryOnReset: boolean,
                private _wsMaxConnectionsPerHost: number | null, private _wsMaxConnectionsTotal: number | null,
                private _poolMaxWaitingRequestsPerHost: number | null, private _createForwardedForHeaders: boolean,
                loggerFactory: MashroomLoggerFactory) {
        const logger = loggerFactory('mashroom.httpProxy');
        const poolConfig = getPoolConfig();
        logger.info(`Initializing http proxy with pool config: ${JSON.stringify(poolConfig, null, 2)} and socket timeout: ${_socketTimeoutMs}ms`);
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
    }

    async forward(req: Request, res: Response, targetUri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.httpProxy');

        // Process interceptors
        const {responseHandled, effectiveTargetUri, effectiveAdditionalHeaders, effectiveQueryParams, streamTransformers: requestStreamTransformers} =
            await processHttpRequestInterceptors(req, res, targetUri, additionalHeaders, this._interceptorHandler, logger);

        if (responseHandled) {
            return;
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

        // Filter the forwarded headers from the incoming request
        const filteredClientRequestHeaders = this._headerFilter.filter(req.headers);

        const proxyRequestHttpHeaders = {
            ...filteredClientRequestHeaders,
            ...effectiveAdditionalHeaders,
            ...forwardedForHeaders,
        };

        // Add query params
        const query = new URLSearchParams();
        Object.keys(effectiveQueryParams).forEach((queryParamName) => {
            const value = effectiveQueryParams[queryParamName];
            if (Array.isArray(value)) {
                value.forEach((val: string | ParsedQs) => query.append(queryParamName, val.toString()));
            } else if (value) {
                query.append(queryParamName, value.toString());
            }
        });

        // Calculate full URI
        let fullTargetUri = effectiveTargetUri;
        const queryStr = query.toString();
        if (queryStr) {
            if (fullTargetUri.indexOf('?') === -1) {
                fullTargetUri = `${fullTargetUri}?${queryStr}`;
            } else {
                fullTargetUri = `${fullTargetUri}&${queryStr}`;
            }
        }

        const startTime = process.hrtime();
        logger.info(`Forwarding ${req.method} request to: ${fullTargetUri}`);

        await this._repeatableForwardHttpRequest({
            startTime,
            req,
            res,
            logger,
            targetUri,
            fullTargetUri,
            proxyRequestHttpHeaders,
            requestStreamTransformers,
            retry: 0,
        });
    }

    async forwardWs(req: IncomingMessageWithContext, socket: Socket, head: Buffer, targetUri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.httpProxy');

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

        // Metrics
        this._requestMetrics.wsRequestCountTotal ++;
        const target = `${protocol}//${host}`;
        if (!this._requestMetrics.wsRequestTargetCount[target]) {
            this._requestMetrics.wsRequestTargetCount[target] = 0;
        }
        this._requestMetrics.wsRequestTargetCount[target] ++;

        if (req.headers.upgrade !== 'websocket') {
            throw new Error(`Upgrade not supported: ${req.headers.upgrade}`);
        }

        let forwardedForHeaders = {};
        if (this._createForwardedForHeaders) {
            forwardedForHeaders = createForwardedForHeaders(req);
        }

        // Filter the forwarded headers from the incoming request
        const filteredClientRequestHeaders = this._headerFilter.filter(req.headers);

        const proxyRequestHttpHeaders = {
            ...filteredClientRequestHeaders,
            ...effectiveAdditionalHeaders,
            ...forwardedForHeaders,
            connection: 'Upgrade',
            upgrade: 'websocket',
        };

        logger.info(`Forwarding WebSocket request to: ${effectiveTargetUri}`);

        let aborted = false;

        try {
            // Send upgrade request to target
            const proxyRequest = this._createProxyRequest(effectiveTargetUri, 'GET', proxyRequestHttpHeaders);
            proxyRequest.setTimeout(this._socketTimeoutMs, () => {
                // Abort proxy request
                aborted = true;
                proxyRequest.destroy();
            });
            proxyRequest.end();

            const [proxyResponse, proxySocket] = await this._createProxyWebsocketSocket(proxyRequest, logger);

            // Respond to the client upgrade request
            socket.write(this._createRawHttpHeaders('HTTP/1.1 101 Switching Protocols', proxyResponse.headers));

            socket.setKeepAlive(true);
            proxySocket.setKeepAlive(true);

            logger.info(`WebSocket connection for ${effectiveTargetUri} established:`, proxySocket.address());
            this._wsConnectionMetrics.activeConnections ++;
            if (!this._wsConnectionMetrics.activeConnectionsTargetCount[target]) {
                this._wsConnectionMetrics.activeConnectionsTargetCount[target] = 0;
            }
            this._wsConnectionMetrics.activeConnectionsTargetCount[target] ++;

            // Connect sockets
            await pipeline(
                proxySocket,
                socket,
                proxySocket,
            );

            logger.info(`WebSocket connection for ${effectiveTargetUri} closed`);

        } catch (error: any) {
            if (error.code === 'ERR_STREAM_PREMATURE_CLOSE') {
                // "Normal" close by the client
                logger.info(`WebSocket connection for ${effectiveTargetUri} closed`);
            } else {
                logger.error(`Forwarding WebSocket request to '${effectiveTargetUri}' failed!`, error);
                if (aborted) {
                    socket.end('HTTP/1.1 504 Gateway Timeout\r\n\r\n', 'ascii');
                } else {
                    socket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n', 'ascii');
                }
                this._requestMetrics.wsConnectionErrorCountTotal++;
                if (!this._requestMetrics.wsConnectionErrorTargetCount[target]) {
                    this._requestMetrics.wsConnectionErrorTargetCount[target] = 0;
                }
                this._requestMetrics.wsConnectionErrorTargetCount[target]++;
            }
        }

        this._wsConnectionMetrics.activeConnections --;
        if (this._wsConnectionMetrics.activeConnectionsTargetCount[target]) {
            this._wsConnectionMetrics.activeConnectionsTargetCount[target] --;
            if (this._wsConnectionMetrics.activeConnectionsTargetCount[target] === 0) {
                delete this._wsConnectionMetrics.activeConnectionsTargetCount[target];
            }
        }
    }

    shutdown(): void {
        // Nothing to do
    }

    getRequestMetrics(): RequestMetrics {
        return this._requestMetrics;
    }

    getWSConnectionMetrics(): WSConnectionMetrics | null {
        return this._wsConnectionMetrics;
    }

    private _createRawHttpHeaders(statusLine: string, headers: HttpHeaders): string {
        return `${Object.keys(headers).reduce(function (head, key) {
            const value = headers[key];
            if (!Array.isArray(value)) {
                head.push(`${key  }: ${value}`);
                return head;
            }
            for (let i = 0; i < value.length; i++) {
                head.push(`${key}: ${value[i]}`);
            }
            return head;
        }, [statusLine])
            .join('\r\n')  }\r\n\r\n`;
    }

    private _createProxyRequest(uri: string, method: string, headers: HttpHeaders): ClientRequest {
        const isWebsocket = uri.startsWith('ws');
        const [mod, agent] = uri.startsWith('https://') ? [https, !isWebsocket && getHttpsPool()] : [http, !isWebsocket && getHttpPool()];
        const httpUri = isWebsocket ? `http${uri.substring(2)}` : uri;
        return mod.request(httpUri, {
            method,
            headers,
            agent,
            rejectUnauthorized: this._rejectUnauthorized,
        });
    }

    private async _createProxyResponse(request: ClientRequest): Promise<IncomingMessage> {
        return new Promise((resolve, reject) => {
            request.on('response', (response) => {
                resolve(response);
            });
            request.on('error', (err) => {
                reject(err);
            });
        });
    }

    private async _createProxyWebsocketSocket(request: ClientRequest, logger: MashroomLogger): Promise<[IncomingMessage, Socket]> {
        return new Promise((resolve, reject) => {
            request.on('response', async (response) => {
                if (!response.headers.upgrade) {
                    // Upgrade went wrong
                    const content = [];
                    for await (const data of response) {
                        content.push(data);
                    }
                    logger.error(`Target did not upgrade to WebSocket but returned: HTTP: ${response.statusCode} ${Buffer.from(content).toString()}`);
                    response.destroy();
                    reject(new Error('Target did not upgrade'));
                }
            });
            request.on('upgrade', (response, socket, head) => {
                // It should be ok to just ignore head (the body of the upgrade response), this is typically just some greeting
                // otherwise we would have to do a socket.unshift(head) to send it to the client
                resolve([response, socket]);
            });
            request.on('error', (err) => {
                reject(err);
            });
        });
    }

    private async _repeatableForwardHttpRequest(config: {
        startTime: [number, number];
        req: Request;
        res: Response;
        logger: MashroomLogger;
        targetUri: string;
        fullTargetUri: string;
        proxyRequestHttpHeaders: HttpHeaders;
        requestStreamTransformers: Array<Transform>;
        retry: number;
    }): Promise<void> {
        const {
            startTime, req, res, logger, targetUri,
            fullTargetUri, proxyRequestHttpHeaders, requestStreamTransformers, retry
        } = config;
        let aborted = false;
        let proxyRequest: ClientRequest | undefined;
        try {
            proxyRequest = this._createProxyRequest(fullTargetUri, req.method, proxyRequestHttpHeaders);
            proxyRequest.setTimeout(this._socketTimeoutMs, () => {
                aborted = true;
                // Abort proxy request
                proxyRequest?.destroy();
            });

            // Stream the client request
            await pipeline(
                req,
                ...requestStreamTransformers /* help TypeScript to understand which signature to use */ as [Transform],
                proxyRequest
            );

            // Wait for response headers
            const proxyResponse = await this._createProxyResponse(proxyRequest);

            const headersEndTime = process.hrtime(startTime);
            logger.info(`Response headers received from ${fullTargetUri} received in ${headersEndTime[0]}s ${headersEndTime[1] / 1000000}ms with status ${proxyResponse.statusCode}`);

            // Process interceptors
            // Pause the stream flow until the async op is finished
            proxyResponse.pause();
            const {responseHandled, streamTransformers: responseStreamTransformers} = await processHttpResponseInterceptors(req, res, targetUri, proxyResponse, this._interceptorHandler, logger);
            proxyResponse.resume();

            if (responseHandled) {
                return;
            }

            // Filter the headers from the target response
            const filteredProxyResponseHeaders  =this._headerFilter.filter(proxyResponse.headers);

            // Copy headers to the client response
            res.status(proxyResponse.statusCode ?? 500);
            Object.keys(filteredProxyResponseHeaders).forEach((headerKey) => {
                res.setHeader(headerKey, filteredProxyResponseHeaders[headerKey] as string | Array<string>);
            });

            // Stream back the proxy response
            await pipeline(
                proxyResponse,
                ...responseStreamTransformers /* help Typescript to understand which signature to use */ as  [Transform],
                res
            );

            const responseEndTime = process.hrtime(startTime);
            logger.info(`Response from ${fullTargetUri} sent to client in ${responseEndTime[0]}s ${responseEndTime[1] / 1000000}ms`);

        } catch (error: any) {
            const target = this._getProtocolAndHost(fullTargetUri);
            let trackConnectionError = false;
            if (aborted || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
                logger.error(`Target endpoint '${fullTargetUri}' did not send a response within ${this._socketTimeoutMs}ms!`);
                this._requestMetrics.httpTimeoutCountTotal++;
                if (!this._requestMetrics.httpTimeoutTargetCount[target]) {
                    this._requestMetrics.httpTimeoutTargetCount[target] = 0;
                }
                this._requestMetrics.httpTimeoutTargetCount[target]++;
                if (!res.headersSent) {
                    res.sendStatus(504);
                }
            } else if (req.closed && (error.code === 'ERR_STREAM_PREMATURE_CLOSE' || error.code === 'ERR_STREAM_UNABLE_TO_PIPE' || (!proxyRequest?.closed && error.code === 'ECONNRESET' && error.message === 'aborted'))) {
                logger.info(`Request aborted by client: '${fullTargetUri}'`);
            } else if (!res.headersSent && error.code === 'ECONNRESET') {
                if (this._retryOnReset && retry < MAX_RETRIES) {
                    logger.warn(`Retrying HTTP request to '${fullTargetUri}' because target did not accept or drop the connection (retry #${retry + 1})`);
                    return this._repeatableForwardHttpRequest({
                        ...config,
                        retry: retry + 1,
                    });
                } else {
                    logger.error(`Forwarding HTTP request to '${fullTargetUri}' failed! Target did not accept the connection after ${retry + 1} attempt(s)`, error);
                    trackConnectionError = true;
                    if (!res.headersSent) {
                        res.sendStatus(502);
                    }
                }
            } else {
                logger.error(`Forwarding to '${fullTargetUri}' failed!`, error);
                trackConnectionError = true;
                if (!res.headersSent) {
                    res.sendStatus(502);
                }
            }
            if (trackConnectionError) {
                this._requestMetrics.httpConnectionErrorCountTotal ++;
                if (!this._requestMetrics.httpConnectionErrorTargetCount[target]) {
                    this._requestMetrics.httpConnectionErrorTargetCount[target] = 0;
                }
                this._requestMetrics.httpConnectionErrorTargetCount[target] ++;
            }
        }
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

    private _getProtocolAndHost(uri: string) {
        const {protocol, host} = new URL(uri);
        return `${protocol}//${host}`;
    }
}
