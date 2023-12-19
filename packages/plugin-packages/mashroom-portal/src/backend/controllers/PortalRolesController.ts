
import {isAdmin} from '../utils/security-utils';

import type {Request, Response} from 'express';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

export default class PortalRolesController {

    async getExistingRoles(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const existingRoles = await securityService.getExistingRoles(req);

            res.json(existingRoles);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
