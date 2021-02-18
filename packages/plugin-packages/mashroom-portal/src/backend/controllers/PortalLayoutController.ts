
import {isAdmin} from '../utils/security_utils';

import type {Request, Response} from 'express';
import type {MashroomAvailablePortalLayout} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalLayoutController {

    constructor(private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async getAvailablePortalLayouts(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const availableLayouts: Array<MashroomAvailablePortalLayout> = this._pluginRegistry.layouts.map((t) => ({
                name: t.name,
                description: t.description,
                lastReloadTs: t.lastReloadTs
            }));

            res.json(availableLayouts);
        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
