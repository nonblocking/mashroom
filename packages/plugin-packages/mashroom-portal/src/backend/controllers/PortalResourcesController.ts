
import path from 'path';

import type {Request, Response} from 'express';
import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';

export default class PortalResourcesController {

    async getPortalClient(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const cacheControlService: MashroomCacheControlService = reqWithContext.pluginContext.services.browserCache && reqWithContext.pluginContext.services.browserCache.cacheControl;

        const portalClientBundle = path.resolve(__dirname, '../../frontend/portal-client.js');
        res.type('application/javascript');

        if (cacheControlService) {
            await cacheControlService.addCacheControlHeader(false, reqWithContext, res);
        }

        res.sendFile(portalClientBundle);
    }

}
