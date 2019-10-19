// @flow

import http from 'http';
import request from 'request';
import HttpHeaderFilter from './HttpHeaderFilter';

import type {
    MashroomLogger,
    MashroomLoggerFactory,
    ExpressRequest,
    ExpressResponse,
} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders, HttpHeaderFilter as HttpHeaderFilterType, MashroomHttpProxyService as MashroomHttpProxyServiceType} from '../type-definitions';

export default class MashroomHttpProxyService implements MashroomHttpProxyServiceType {

    _forwardMethods: Array<string>;
    _rejectUntrustedCerts: boolean;
    _poolMaxSockets: number;
    _socketTimeoutMs: number;
    _pool: any;
    _httpHeaderFilter: HttpHeaderFilterType;
    _logger: MashroomLogger;

    constructor(forwardMethods: Array<string>, forwardHeaders: Array<string>, rejectUntrustedCerts: boolean, poolMaxSockets: number, socketTimeoutMs: number, loggerFactory: MashroomLoggerFactory) {
        this._forwardMethods = forwardMethods;
        this._rejectUntrustedCerts = rejectUntrustedCerts;
        this._poolMaxSockets = poolMaxSockets || 10;
        this._socketTimeoutMs = socketTimeoutMs || 0;
        this._httpHeaderFilter = new HttpHeaderFilter(forwardHeaders);
        this._logger = loggerFactory('mashroom.httpProxy');

        this._logger.info(`Initializing http proxy with maxSockets: ${this._poolMaxSockets} and socket timeout: ${this._socketTimeoutMs}ms`);
        this._pool = new http.Agent({
            keepAlive: true,
            maxSockets: this._poolMaxSockets,
        });
    }

    forward(req: ExpressRequest, res: ExpressResponse, uri: string, additionalHeaders?: HttpHeaders = {}) {

        const method = req.method;
        if (!this._forwardMethods.find((m) => m === method)) {
            res.sendStatus(405);
            return Promise.resolve();
        }
        if (req.headers.upgrade) {
            this._logger.error(`Client requested upgrade to '${req.headers.upgrade}' which is not supported by the proxy!`);
            res.sendStatus(406);
            return Promise.resolve();
        }

        this._httpHeaderFilter.filter(req.headers);
        const qs = Object.assign({}, req.query);

        const options = {
            pool: this._pool,
            method,
            uri,
            qs,
            headers: additionalHeaders,
            rejectUnauthorized: this._rejectUntrustedCerts,
            resolveWithFullResponse: true,
            timeout: this._socketTimeoutMs,
        };

        const startTime = process.hrtime();
        this._logger.info(`Forwarding ${options.method} request to: ${options.uri}`);

        return new Promise<void>((resolve) => {
            req.pipe(
                request(options)
                    .on('response', (targetResponse) => {
                        this._httpHeaderFilter.filter(targetResponse.headers);
                        const endTime = process.hrtime(startTime);
                        this._logger.info(`Received from ${options.uri}: Status ${targetResponse.statusCode} in ${endTime[0]}s ${endTime[1] / 1000000}ms`);
                        res.status(targetResponse.statusCode);
                    })
                    .on('error', (error) => {
                        if (error.code === 'ETIMEDOUT') {
                            this._logger.error(`Target endpoint '${uri}' did not send a response within ${this._socketTimeoutMs}ms!`, error);
                            res.sendStatus(504);
                        } else {
                            this._logger.error(`Forwarding to '${uri}' failed!`, error);
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
                            this._logger.error('Error sending the response to the client', error);
                            res.sendStatus(500);
                            resolve();
                        })
                );
        });
    }

}
