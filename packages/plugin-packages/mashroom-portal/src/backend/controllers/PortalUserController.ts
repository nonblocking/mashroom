
// @ts-ignore
import {isHtmlRequest} from '@mashroom/mashroom-utils/lib/request_utils';
import {getFrontendSiteBasePath} from '../utils/path_utils';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

type NewLanguage = {
    lang: string
}

export default class PortalUserController {

    async getAuthenticatedUserAuthenticationExpiration(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const securityService: MashroomSecurityService = reqWithContext.pluginContext.services.security.service;

            const expirationTime = await securityService.getAuthenticationExpiration(reqWithContext);
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

    async setAuthenticatedUserLanguage(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const i18nService: MashroomI18NService = reqWithContext.pluginContext.services.i18n.service;

            const body = req.body;
            const newLanguage: NewLanguage = body;

            if (newLanguage && newLanguage.lang && i18nService.availableLanguages.indexOf(newLanguage.lang) !== -1) {
                logger.info(`Setting new user language: ${newLanguage.lang}`);
                i18nService.setLanguage(newLanguage.lang, reqWithContext);
            } else {
                logger.error(`Invalid language: ${newLanguage && newLanguage.lang}`);
            }

            res.end();

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');
        logger.debug('Logout called');

        try {
            const securityService: MashroomSecurityService = reqWithContext.pluginContext.services.security.service;
            await securityService.revokeAuthentication(reqWithContext);

            if (isHtmlRequest(req)) {
                let redirectUrl = null;
                if (req.query.redirectUrl) {
                    // Use the redirect query param if any
                    const redirectParam = decodeURIComponent(req.query.redirectUrl as string);
                    if (redirectParam.startsWith('/')) {
                        redirectUrl = redirectParam;
                    }
                }

                if (!redirectUrl) {
                    // Default: Redirect to the site root
                    redirectUrl = getFrontendSiteBasePath(reqWithContext) || '/';
                }

                res.redirect(redirectUrl);
            } else {
                res.end();
            }
        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
