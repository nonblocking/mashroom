// @flow

import {isAdmin} from '../utils/security_utils';

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

export default class PortalRolesController {

    async getExistingRoles(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const existingRoles = await securityService.getExistingRoles(req);

            res.json(existingRoles);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
