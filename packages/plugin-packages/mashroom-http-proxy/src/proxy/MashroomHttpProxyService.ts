
import { URL } from 'url';
import {getWaitingRequestsForHostHeader} from '../connection_pool';
import type {Request, Response} from 'express';
import type {Socket} from 'net';
import type {HttpHeaders, MashroomHttpProxyService as MashroomHttpProxyServiceType} from '../../type-definitions';
import type {Proxy} from '../../type-definitions/internal';

export default class MashroomHttpProxyService implements MashroomHttpProxyServiceType {

    constructor(private _forwardMethods: Array<string>, private _proxy: Proxy, private _poolMaxWaitingRequestsPerHost?: number | null | undefined) {
    }

    async forward(req: Request, res: Response, uri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.httpProxy');

        const method = req.method;
        if (!this._forwardMethods.find((m) => m === method)) {
            logger.debug('Method not allowed:', method);
            res.sendStatus(405);
            return;
        }

        const {protocol, host} = new URL(uri);
        if (protocol !== 'http:' && protocol !== 'https:') {
            logger.error(`Cannot forward to ${uri} because the protocol is not supported`);
            res.sendStatus(400);
            return;
        }

        if (typeof this._poolMaxWaitingRequestsPerHost === 'number' && this._poolMaxWaitingRequestsPerHost > 0) {
            if (getWaitingRequestsForHostHeader(protocol, host) >= this._poolMaxWaitingRequestsPerHost) {
                logger.error(`Cannot forward to ${uri} because there are already to many waiting requests`);
                res.sendStatus(429);
                return;
            }
        }

        return this._proxy.forward(req, res, uri, additionalHeaders);
    }

    async forwardWs(req: Request, socket: Socket, head: Buffer, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void> {
        return this._proxy.forwardWs(req, socket, head, targetUri, additionalHeaders);
    }
}
