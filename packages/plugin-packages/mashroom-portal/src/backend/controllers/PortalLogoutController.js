// @flow

import type {
    ExpressRequest,
    ExpressResponse, MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

export default class PortalLogoutController {

    async logout(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            logger.debug('Logout called');

            await securityService.revokeAuthentication(req);

            const indexPage = req.pluginContext.serverConfig.indexPage;
            res.redirect(indexPage);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }
}
