
import {isAdmin} from '../utils/security_utils';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

export default class PortalRolesController {

    async getExistingRoles(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const securityService: MashroomSecurityService = reqWithContext.pluginContext.services.security.service;

            if (!isAdmin(reqWithContext)) {
                res.sendStatus(403);
                return;
            }

            const existingRoles = await securityService.getExistingRoles(reqWithContext);

            res.json(existingRoles);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
