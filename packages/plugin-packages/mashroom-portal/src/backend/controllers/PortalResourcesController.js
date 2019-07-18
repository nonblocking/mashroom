// @flow

import path from 'path';

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';

export default class PortalResourcesController {

    async getPortalClient(req: ExpressRequest, res: ExpressResponse) {
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache && req.pluginContext.services.browserCache.cacheControl;

        const portalClientBundle = path.resolve(__dirname, '../../frontend/portal-client.js');
        res.type('application/javascript');

        if (cacheControlService) {
            await cacheControlService.addCacheControlHeader(req, res);
        }

        res.sendFile(portalClientBundle);
    }

}
