
import path from 'path';

import type {Request, Response} from 'express';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';

export default class PortalResourcesController {

    async getPortalClient(req: Request, res: Response): Promise<void> {
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        const portalClientBundle = path.resolve(__dirname, '../../frontend/portal-client.js');
        res.type('text/javascript');

        if (cacheControlService) {
            cacheControlService.addCacheControlHeader('SHARED', req, res);
        }

        res.sendFile(portalClientBundle);
    }

}
