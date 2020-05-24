
import request from 'request';
import HttpHeaderFilter from './HttpHeaderFilter';
import {getPoolConfig, getHttpPool, getHttpsPool} from '../connection_pool';

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {HttpHeaders, MashroomHttpProxyService as MashroomHttpProxyServiceType} from '../../type-definitions';
import type {HttpHeaderFilter as HttpHeaderFilterType} from '../../type-definitions/internal';

export default class MashroomHttpProxyService implements MashroomHttpProxyServiceType {

    private httpHeaderFilter: HttpHeaderFilterType;

    constructor(private forwardMethods: Array<string>, private forwardHeaders: Array<string>, private socketTimeoutMs: number, loggerFactory: MashroomLoggerFactory) {
        this.httpHeaderFilter = new HttpHeaderFilter(forwardHeaders);

        const poolConfig = getPoolConfig();
        const logger = loggerFactory('mashroom.httpProxy');
        logger.info(`Initializing http proxy with maxSockets: ${poolConfig.maxSockets} and socket timeout: ${this.socketTimeoutMs}ms`);
    }

    forward(req: ExpressRequest, res: ExpressResponse, uri: string, additionalHeaders: HttpHeaders = {}) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.httpProxy');
        const securityService: MashroomSecurityService = req.pluginContext.services.security && req.pluginContext.services.security.service;

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

        this.httpHeaderFilter.filter(req.headers);
        const qs = {...req.query};

        const extraSecurityHeaders = securityService ? securityService.getApiSecurityHeaders(req, uri) : null;

        const headers = {...additionalHeaders || {}, ...extraSecurityHeaders || {}};

        const options = {
            agent: uri.startsWith('https') ? getHttpsPool() : getHttpPool(),
            method,
            uri,
            qs,
            headers,
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

}
