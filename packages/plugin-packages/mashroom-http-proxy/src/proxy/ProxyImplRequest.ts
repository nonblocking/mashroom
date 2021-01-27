
import request from 'request';
import {getHttpPool, getHttpsPool, getPoolConfig} from '../connection_pool';

import type {ExpressRequest, ExpressResponse, MashroomLoggerFactory, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders} from '../../type-definitions';
import type {Proxy, HttpHeaderFilter, InterceptorHandler} from '../../type-definitions/internal';

/**
 * A Proxy implementation based on the request library
 */
export default class ProxyImplRequest implements Proxy {

    constructor(private socketTimeoutMs: number, private interceptorHandler: InterceptorHandler, private headerFilter: HttpHeaderFilter, loggerFactory: MashroomLoggerFactory) {
        const poolConfig = getPoolConfig();
        const logger = loggerFactory('mashroom.httpProxy');
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

        // Execute interceptors
        const interceptorResult = await this.interceptorHandler.processRequest(req, res, uri, additionalHeaders, logger);
        if (interceptorResult.responseHandled) {
            return Promise.resolve();
        }

        const effectiveTargetUri = interceptorResult.rewrittenTargetUri || uri;

        // Process additional headers
        let effectiveAdditionalHeaders = {
            ...additionalHeaders,
        };
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

        // Process query params
        let effectiveQueryParams = {
            ...req.query
        };
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
            req.pipe(
                request(options)
                    .on('response', (targetResponse) => {
                        this.headerFilter.filter(targetResponse.headers);
                        const endTime = process.hrtime(startTime);
                        logger.info(`Received from ${options.uri}: Status ${targetResponse.statusCode} in ${endTime[0]}s ${endTime[1] / 1000000}ms`);
                        res.status(targetResponse.statusCode);
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
                    }))
                .pipe(
                    res
                        .on('finish', () => {
                            resolve();
                        })
                        .on('error', (error) => {
                            logger.error('Error sending the response to the client', error);
                            res.sendStatus(500);
                            resolve();
                        })
                );
        });
    }

}
