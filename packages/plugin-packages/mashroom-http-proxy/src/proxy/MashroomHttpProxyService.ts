

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders, MashroomHttpProxyService as MashroomHttpProxyServiceType} from '../../type-definitions';
import type {Proxy} from '../../type-definitions/internal';

export default class MashroomHttpProxyService implements MashroomHttpProxyServiceType {

    constructor(private forwardMethods: Array<string>, private proxy: Proxy) {
    }

    async forward(req: ExpressRequest, res: ExpressResponse, uri: string, additionalHeaders: HttpHeaders = {}): Promise<void> {
        const method = req.method;
        if (!this.forwardMethods.find((m) => m === method)) {
            res.sendStatus(405);
            return Promise.resolve();
        }

        return this.proxy.forward(req, res, uri, additionalHeaders);
    }
}
