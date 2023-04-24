
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

        const {protocol, host} = new URL(uri);
        if (protocol !== 'http:' && protocol !== 'https:') {
            throw new Error(`Cannot forward to ${uri} because the protocol is not supported (only HTTP and HTTPS is)`);
        }

        const method = req.method;
        if (!this._forwardMethods.find((m) => m === method)) {
            logger.debug('Method not allowed:', method);
            res.sendStatus(405);
            return;
        }

        if (typeof this._poolMaxWaitingRequestsPerHost === 'number' && this._poolMaxWaitingRequestsPerHost > 0) {
            if (getWaitingRequestsForHostHeader(protocol, host) >= this._poolMaxWaitingRequestsPerHost) {
                logger.error(`Cannot forward to ${uri} because max waiting requests per host reached (${this._poolMaxWaitingRequestsPerHost})`);
                res.sendStatus(429);
                return;
            }
        }

        return this._proxy.forward(req, res, uri, additionalHeaders);
    }

    async forwardWs(req: Request, socket: Socket, head: Buffer, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.httpProxy');

        const {protocol} = new URL(targetUri);
        if (protocol !== 'ws:' && protocol !== 'wss:') {
            throw new Error(`Cannot forward to ${targetUri} because the protocol is not supported (only WS and WSS is)`);
            return;
        }

        return this._proxy.forwardWs(req, socket, head, targetUri, additionalHeaders);
    }
}
