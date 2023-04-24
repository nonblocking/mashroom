import request from 'request';
import {getHttpPool, getHttpsPool, getPoolConfig} from '../connection_pool';

import type {Socket} from 'net';
import type {Request, Response} from 'express';
import type {MashroomLoggerFactory, MashroomLogger, IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders} from '../../type-definitions';
import type {Proxy, HttpHeaderFilter, InterceptorHandler, RequestMetrics} from '../../type-definitions/internal';

/**
 * A Proxy implementation based on the request library
 */
export default class ProxyImplRequest implements Proxy {

    private _requestMetrics: RequestMetrics;

    constructor(private _socketTimeoutMs: number, private _interceptorHandler: InterceptorHandler,
                private _headerFilter: HttpHeaderFilter, private _retryOnReset: boolean, loggerFactory: MashroomLoggerFactory) {
        const logger: MashroomLogger = loggerFactory('mashroom.httpProxy');
        const poolConfig = getPoolConfig();
        this._requestMetrics = {
            httpRequestCount: 0,
            httpTargetConnectionErrorCount: 0,
            httpTargetTimeoutCount: 0,
            wsRequestCount: 0,
        };
        logger.info(`Initializing http proxy with pool config: ${JSON.stringify(poolConfig, null, 2)} and socket timeout: ${this._socketTimeoutMs}ms`);
        if (this._retryOnReset) {
            logger.warn('Option retryOnReset not supported by this proxy implementation!');
        }
    }

    async forward(req: Request, res: Response, targetUri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.httpProxy');
        this._requestMetrics.httpRequestCount ++;

        const method = req.method;

        if (req.headers.upgrade) {
            logger.error(`Client requested upgrade to '${req.headers.upgrade}' which is not supported by the proxy!`);
            res.sendStatus(406);
            return Promise.resolve();
        }

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

                    // Execute response interceptors
                    // Pause the stream flow until the async op is finished
                    targetResponse.pause();
                    const interceptorResult = await this._interceptorHandler.processHttpResponse(req, res, targetUri, targetResponse, logger);
                    targetResponse.resume();

                    if (interceptorResult.responseHandled) {
                        resolve();
                        return;
                    }
                    // First filter the headers from the target response
                    this._headerFilter.filter(targetResponse.headers);
                    if (interceptorResult.addHeaders) {
                        Object.keys(interceptorResult.addHeaders).forEach((headerKey) => {
                            targetResponse.headers[headerKey] = interceptorResult.addHeaders?.[headerKey];
                        });
                    }
                    if (interceptorResult.removeHeaders) {
                        interceptorResult.removeHeaders.forEach((headerKey) => {
                            delete targetResponse.headers[headerKey];
                        });
                    }

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
                    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
                        logger.error(`Target endpoint '${targetUri}' did not send a response within ${this._socketTimeoutMs}ms!`, error);
                        this._requestMetrics.httpTargetTimeoutCount ++;
                        if (!res.headersSent) {
                            res.sendStatus(504);
                        }
                    } else {
                        logger.error(`Forwarding to '${targetUri}' failed!`, error);
                        this._requestMetrics.httpTargetConnectionErrorCount ++;
                        if (!res.headersSent) {
                            res.sendStatus(503);
                        }
                    }
                    resolve();
                }));
        });
    }

    async forwardWs(req: IncomingMessageWithContext, socket: Socket, head: Buffer, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void> {
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
