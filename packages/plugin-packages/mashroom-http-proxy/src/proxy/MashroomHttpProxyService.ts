
import request from 'request';
import HttpHeaderFilter from './HttpHeaderFilter';
import {getPoolConfig, getHttpPool, getHttpsPool} from '../connection_pool';

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory,
} from '@mashroom/mashroom/type-definitions';
import type {
    HttpHeaders,
    MashroomHttpProxyService as MashroomHttpProxyServiceType,
    MashroomHttpProxyInterceptorResult
} from '../../type-definitions';
import type {HttpHeaderFilter as HttpHeaderFilterType, MashroomHttpProxyInterceptorRegistry} from '../../type-definitions/internal';

export default class MashroomHttpProxyService implements MashroomHttpProxyServiceType {

    private httpHeaderFilter: HttpHeaderFilterType;

    constructor(private forwardMethods: Array<string>, private forwardHeaders: Array<string>, private socketTimeoutMs: number,
                private interceptorRegistry: MashroomHttpProxyInterceptorRegistry, loggerFactory: MashroomLoggerFactory) {
        this.httpHeaderFilter = new HttpHeaderFilter(forwardHeaders);

        const poolConfig = getPoolConfig();
        const logger = loggerFactory('mashroom.httpProxy');
        logger.info(`Initializing http proxy with maxSockets: ${poolConfig.maxSockets} and socket timeout: ${this.socketTimeoutMs}ms`);
    }

    async forward(req: ExpressRequest, res: ExpressResponse, uri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.httpProxy');

        const method = req.method;
        if (!this.forwardMethods.find((m) => m === method)) {
            res.sendStatus(405);
            return Promise.resolve();
        }
        if (req.headers.upgrade) {
            logger.error(`Client requested upgrade to '${req.headers.upgrade}' which is not supported by the proxy!`);
            res.sendStatus(406);
            return Promise.resolve();
        }

        const interceptorResult = await this.processInterceptors(req, uri, additionalHeaders, logger);
        if (interceptorResult.reject) {
            if (interceptorResult.rejectReason) {
                res.status(interceptorResult.rejectStatusCode || 403).send(interceptorResult.rejectReason);
            } else {
                res.sendStatus(interceptorResult.rejectStatusCode|| 403);
            }
            return Promise.resolve();
        }

        const effectiveTargetUri = interceptorResult.rewrittenTargetUri || uri;

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

        this.httpHeaderFilter.filter(req.headers);
        const qs = {...req.query};

        const options = {
            agent: uri.startsWith('https') ? getHttpsPool() : getHttpPool(),
            method,
            uri: effectiveTargetUri,
            qs,
            headers: effectiveAdditionalHeaders,
            resolveWithFullResponse: true,
            timeout: this.socketTimeoutMs,
        };

        const startTime = process.hrtime();
        logger.info(`Forwarding ${options.method} request to: ${options.uri}`);

        return new Promise<void>((resolve) => {
            req.pipe(
                request(options)
                    .on('response', (targetResponse) => {
                        this.httpHeaderFilter.filter(targetResponse.headers);
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

    private async processInterceptors(req: ExpressRequest, targetUri: string, additionalHeaders: HttpHeaders, logger: MashroomLogger): Promise<MashroomHttpProxyInterceptorResult> {
        let addHeaders = {};
        let removeHeaders: Array<string> = [];
        let rewrittenTargetUri = targetUri;
        const interceptors = this.interceptorRegistry.interceptors;
        for (let i = 0; i < interceptors.length; i++) {
            const {pluginName, interceptor} = interceptors[i];
            try {
                const result = await interceptor.intercept(req, { ...additionalHeaders, ...addHeaders }, rewrittenTargetUri);
                if (result?.reject) {
                    logger.info(`Interceptor: '${pluginName}' rejected call to ${targetUri} with reason: ${result.rejectReason || '-'}`);
                    return result;
                }
                if (result?.rewrittenTargetUri) {
                    logger.info(`Interceptor: '${pluginName}' rewrote target URI ${targetUri} to ${result.rewrittenTargetUri}`);
                    rewrittenTargetUri = result.rewrittenTargetUri;
                }
                if (result?.addHeaders) {
                    logger.debug(`Interceptor: '${pluginName}' added HTTP headers`, result.addHeaders);
                    addHeaders = {
                        ...addHeaders,
                        ...result.addHeaders,
                    }
                }
                if (result?.removeHeaders) {
                    logger.debug(`Interceptor: '${pluginName}' removed HTTP headers`, result.removeHeaders);
                    removeHeaders = [
                        ...removeHeaders,
                        ...result.removeHeaders,
                    ];
                }
            } catch (e) {

            }
        }
        return {
            addHeaders,
            removeHeaders,
            rewrittenTargetUri,
        }
    }
}
