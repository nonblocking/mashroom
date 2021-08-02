

import type {Request, Response} from 'express';
import type {Socket} from 'net';
import type {HttpHeaders, MashroomHttpProxyService as MashroomHttpProxyServiceType} from '../../type-definitions';
import type {Proxy} from '../../type-definitions/internal';

export default class MashroomHttpProxyService implements MashroomHttpProxyServiceType {

    constructor(private _forwardMethods: Array<string>, private _proxy: Proxy) {
    }

    async forward(req: Request, res: Response, uri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const method = req.method;
        if (!this._forwardMethods.find((m) => m === method)) {
            res.sendStatus(405);
            return Promise.resolve();
        }

        return this._proxy.forward(req, res, uri, additionalHeaders);
    }

    async forwardWs(req: Request, socket: Socket, head: Buffer, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void> {
        return this._proxy.forwardWs(req, socket, head, targetUri, additionalHeaders);
    }
}
