
import {isAdmin} from '../utils/security_utils';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomAvailablePortalLayout} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalLayoutController {

    constructor(private pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async getAvailablePortalLayouts(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            if (!isAdmin(reqWithContext)) {
                res.sendStatus(403);
                return;
            }

            const availableLayouts: Array<MashroomAvailablePortalLayout> = this.pluginRegistry.layouts.map((t) => ({
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
