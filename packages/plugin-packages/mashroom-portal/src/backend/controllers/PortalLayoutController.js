// @flow

import {isAdmin} from '../utils/security_utils';

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalService,
    MashroomAvailablePortalLayout
} from '../../../type-definitions';
import type {
    MashroomPortalPluginRegistry,
} from '../../../type-definitions/internal';

export default class PortalLayoutController {

    pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this.pluginRegistry = pluginRegistry;
    }

    async getAvailablePortalLayouts(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const availableLayouts: Array<MashroomAvailablePortalLayout> = portalService.getLayouts().map((t) => ({
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
