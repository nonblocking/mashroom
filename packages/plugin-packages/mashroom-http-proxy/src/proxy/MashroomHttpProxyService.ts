

import type {Request, Response} from 'express';
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
}
