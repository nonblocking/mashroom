import request from 'request';
import {getHttpPool, getHttpsPool, getPoolConfig} from '../connection_pool';

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLoggerFactory,
    MashroomLogger
} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders} from '../../type-definitions';
import type {Proxy, HttpHeaderFilter, InterceptorHandler} from '../../type-definitions/internal';

/**
 * A Proxy implementation based on the request library
 */
export default class ProxyImplRequest implements Proxy {

    constructor(private socketTimeoutMs: number, private interceptorHandler: InterceptorHandler, private headerFilter: HttpHeaderFilter, loggerFactory: MashroomLoggerFactory) {
        const logger = loggerFactory('mashroom.httpProxy');
        const poolConfig = getPoolConfig();
        logger.info(`Initializing http proxy with maxSockets: ${poolConfig.maxSockets} and socket timeout: ${this.socketTimeoutMs}ms`);
    }

    async forward(req: ExpressRequest, res: ExpressResponse, uri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.httpProxy');
        const method = req.method;

        if (req.headers.upgrade) {
            logger.error(`Client requested upgrade to '${req.headers.upgrade}' which is not supported by the proxy!`);
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
        const anyInterceptors = this.interceptorHandler.anyHandlersWantToIntercept(req, uri);
        if (anyInterceptors) {
            // Process request interceptors
            const interceptorResult = await this.interceptorHandler.processRequest(req, res, uri, additionalHeaders, logger);
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
        }

        // Filter the forwarded headers from the incoming request
        this.headerFilter.filter(req.headers);

        const options = {
            agent: uri.startsWith('https') ? getHttpsPool() : getHttpPool(),
            method,
            uri: effectiveTargetUri,
            qs: effectiveQueryParams,
            headers: effectiveAdditionalHeaders,
            encoding: null,
            timeout: this.socketTimeoutMs,
        };

        const startTime = process.hrtime();
        logger.info(`Forwarding ${options.method} request to: ${options.uri}`);

        return new Promise<void>((resolve) => {
            req.pipe(request(options)
                .on('response', async (targetResponse) => {
                    const endTime = process.hrtime(startTime);
                    logger.info(`Received from ${options.uri}: Status ${targetResponse.statusCode} in ${endTime[0]}s ${endTime[1] / 1000000}ms`);

                    if (anyInterceptors) {
                        // Execute response interceptors
                        // Pause the stream flow until the async op is finished - will resume automatically on pipe
                        targetResponse.pause();
                        const interceptorResult = await this.interceptorHandler.processResponse(req, res, uri, targetResponse, logger);

                        if (interceptorResult.responseHandled) {
                            resolve();
                            return;
                        }
                        // First filter the headers from the target response
                        this.headerFilter.filter(targetResponse.headers);
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
                    } else {
                        // Just filter the headers
                        this.headerFilter.filter(targetResponse.headers);
                    }

                    // Send response
                    res.status(targetResponse.statusCode);
                    Object.keys(targetResponse.headers).forEach((headerKey) => {
                        res.setHeader(headerKey, targetResponse.headers[headerKey] as any);
                    });
                    targetResponse.pipe(
                        res
                            .on('finish', () => {
                                resolve();
                            })
                            .on('error', (error) => {
                                logger.error('Error sending the response to the client', error);
                                res.sendStatus(500);
                                resolve();
                            }));

                })
                .on('error', (error: Error & { code?: string }) => {
                    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
                        logger.error(`Target endpoint '${uri}' did not send a response within ${this.socketTimeoutMs}ms!`, error);
                        res.sendStatus(504);
                    } else {
                        logger.error(`Forwarding to '${uri}' failed!`, error);
                        res.sendStatus(503);
                    }
                    resolve();
                }));
        });
    }

    shutdown(): void {
        // Nothing to do
    }

}
