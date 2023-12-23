import request from 'request';
import {getHttpPool, getHttpsPool, getPoolConfig, getWaitingRequestsForHostHeader} from '../connection-pool';
import {processHttpResponse, processRequest} from './utils';

import type {Request, Response} from 'express';
import type {MashroomLoggerFactory, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders} from '../../type-definitions';
import type {Proxy, HttpHeaderFilter, InterceptorHandler, RequestMetrics} from '../../type-definitions/internal';

/**
 * A Proxy implementation based on the request library
 */
export default class ProxyImplRequest implements Proxy {

    private _requestMetrics: RequestMetrics;

    constructor(private _socketTimeoutMs: number, private _interceptorHandler: InterceptorHandler,
                private _headerFilter: HttpHeaderFilter, private _retryOnReset: boolean,
                private _poolMaxWaitingRequestsPerHost: number | null, loggerFactory: MashroomLoggerFactory) {
        const logger: MashroomLogger = loggerFactory('mashroom.httpProxy');
        const poolConfig = getPoolConfig();
        this._requestMetrics = {
            httpRequestCountTotal: 0,
            httpRequestTargetCount: {},
            httpConnectionErrorCountTotal: 0,
            httpConnectionErrorTargetCount: {},
            httpTimeoutCountTotal: 0,
            httpTimeoutTargetCount: {},
            wsRequestCount: 0,
        };
        logger.info(`Initializing http proxy with pool config: ${JSON.stringify(poolConfig, null, 2)} and socket timeout: ${this._socketTimeoutMs}ms`);
        if (this._retryOnReset) {
            logger.warn('Option retryOnReset not supported by this proxy implementation!');
        }
    }

    async forward(req: Request, res: Response, targetUri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.httpProxy');

        const method = req.method;

        if (req.headers.upgrade) {
            logger.error(`Client requested upgrade to '${req.headers.upgrade}' which is not supported by the proxy!`);
            res.sendStatus(406);
            return Promise.resolve();
        }

        // Process interceptors
        const {responseHandled, effectiveTargetUri, effectiveAdditionalHeaders, effectiveQueryParams} = await processRequest(req, res, targetUri, additionalHeaders, this._interceptorHandler, logger);
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

        // Filter the forwarded headers from the incoming request
        this._headerFilter.filter(req.headers);

        const options = {
            agent: targetUri.startsWith('https') ? getHttpsPool() : getHttpPool(),
            method,
            uri: effectiveTargetUri,
            qs: effectiveQueryParams,
            headers: effectiveAdditionalHeaders,
            encoding: null,
            timeout: this._socketTimeoutMs,
        };

        const startTime = process.hrtime();
        logger.info(`Forwarding ${options.method} request to: ${options.uri}`);

        return new Promise<void>((resolve) => {
            req.pipe(request(options)
                .on('response', async (targetResponse) => {
                    const endTime = process.hrtime(startTime);
                    logger.info(`Response headers received from ${options.uri} received in ${endTime[0]}s ${endTime[1] / 1000000}ms with status ${targetResponse.statusCode}`);

                    // Process interceptors
                    // Pause the stream flow until the async op is finished
                    targetResponse.pause();
                    const {responseHandled} = await processHttpResponse(req, res, targetUri, targetResponse, this._interceptorHandler, logger);
                    targetResponse.resume();

                    if (responseHandled) {
                        return;
                    }

                    // Filter the headers from the target response
                    this._headerFilter.filter(targetResponse.headers);

                    // Send response
                    res.status(targetResponse.statusCode);
                    Object.keys(targetResponse.headers).forEach((headerKey) => {
                        res.setHeader(headerKey, targetResponse.headers[headerKey] as string | Array<string>);
                    });
                    targetResponse.pipe(
                        res
                            .on('finish', () => {
                                const endTime = process.hrtime(startTime);
                                logger.info(`Response from ${options.uri} sent to client in ${endTime[0]}s ${endTime[1] / 1000000}ms`);
                                resolve();
                            })
                            .on('error', (error: Error) => {
                                logger.error('Error sending the response to the client', error);
                                res.sendStatus(500);
                                resolve();
                            }));

                })
                .on('error', (error: NodeJS.ErrnoException) => {
                    const {protocol, host} = new URL(targetUri);
                    const target = `${protocol}//${host}`;
                    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
                        logger.error(`Target endpoint '${targetUri}' did not send a response within ${this._socketTimeoutMs}ms!`, error);
                        this._requestMetrics.httpTimeoutCountTotal ++;
                        if (!this._requestMetrics.httpTimeoutTargetCount[target]) {
                            this._requestMetrics.httpTimeoutTargetCount[target] = 0;
                        }
                        this._requestMetrics.httpTimeoutTargetCount[target] ++;
                        if (!res.headersSent) {
                            res.sendStatus(504);
                        }
                    } else {
                        logger.error(`Forwarding to '${targetUri}' failed!`, error);
                        this._requestMetrics.httpConnectionErrorCountTotal ++;
                        if (!this._requestMetrics.httpConnectionErrorTargetCount[target]) {
                            this._requestMetrics.httpConnectionErrorTargetCount[target] = 0;
                        }
                        this._requestMetrics.httpConnectionErrorTargetCount[target] ++;
                        if (!res.headersSent) {
                            res.sendStatus(503);
                        }
                    }
                    resolve();
                }));
        });
    }

    async forwardWs(): Promise<void> {
        throw new Error('WebSockets are not supported by this HTTP proxy implementation (request)');
    }

    shutdown(): void {
        // Nothing to do
    }

    getRequestMetrics(): RequestMetrics {
        return this._requestMetrics;
    }

    getWSConnectionMetrics() {
        return null;
    }
}
