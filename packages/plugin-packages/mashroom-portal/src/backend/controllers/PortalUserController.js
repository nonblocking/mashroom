// @flow

import { isAjaxRequest } from '../utils/request_utils';

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

type NewLanguage = {
    lang: string
}

export default class PortalLanguageController {

    async getAuthenticatedUserAuthenticationExpiration(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            const expirationTime = await securityService.getAuthenticationExpiration(req);
            if (!expirationTime) {
                res.sendStatus(400);
                return;
            }

            res.json({
                expirationTime,
            });

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async setAuthenticatedUserLanguage(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

            const body = req.body;
            const newLanguage: NewLanguage = body;

            if (newLanguage && newLanguage.lang && i18nService.availableLanguages.indexOf(newLanguage.lang) !== -1) {
                logger.info(`Setting new user language: ${newLanguage.lang}`);
                i18nService.setLanguage(newLanguage.lang, req);
            } else {
                logger.error(`Invalid language: ${newLanguage && newLanguage.lang}`);
            }

            res.end();

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async logout(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');
        logger.debug('Logout called');

        try {
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
            await securityService.revokeAuthentication(req);

            if (!isAjaxRequest(req)) {
                // Redirect to start page
                const indexPage = req.pluginContext.serverConfig.indexPage;
                res.redirect(indexPage);
            } else {
                res.end();
            }
        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
