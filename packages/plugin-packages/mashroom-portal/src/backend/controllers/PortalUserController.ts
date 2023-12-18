
import {requestUtils} from '@mashroom/mashroom-utils';
import {getFrontendSiteBasePath} from '../utils/path_utils';

import type {Request, Response} from 'express';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';

type NewLanguage = {
    lang: string
}

export default class PortalUserController {

    async getAuthenticatedUserAuthenticationExpirationTime(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
            const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

            const expirationTime = await securityService.getAuthenticationExpiration(req);
            if (!expirationTime) {
                // There is no user
                res.sendStatus(400);
                return;
            }

            if (cacheControlService) {
                cacheControlService.addCacheControlHeader('NEVER', req, res);
            }

            res.json({
                expirationTime,
            });

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getAuthenticatedUserTimeToAuthenticationExpiration(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
            const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

            const expirationTime = await securityService.getAuthenticationExpiration(req);
            if (!expirationTime) {
                // There is no user
                res.sendStatus(400);
                return;
            }

            if (cacheControlService) {
                cacheControlService.addCacheControlHeader('NEVER', req, res);
            }

            const timeToExpiration = expirationTime - Date.now();

            res.json({
                timeToExpiration,
            });

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async setAuthenticatedUserLanguage(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const i18nService: MashroomI18NService = req.pluginContext.services.i18n!.service;

            const body = req.body;
            const newLanguage: NewLanguage = body;

            if (newLanguage && newLanguage.lang && i18nService.availableLanguages.indexOf(newLanguage.lang) !== -1) {
                logger.info(`Setting new user language: ${newLanguage.lang}`);
                i18nService.setLanguage(newLanguage.lang, req);
            } else {
                logger.error(`Invalid language: ${newLanguage && newLanguage.lang}`);
            }

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        logger.debug('Logout called');

        try {
            const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
            const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

            if (securityService.getUser(req)) {
                await securityService.revokeAuthentication(req);
            }

            if (requestUtils.isHtmlRequest(req)) {
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
                    redirectUrl = getFrontendSiteBasePath(req) || '/';
                }

                if (cacheControlService) {
                    cacheControlService.addCacheControlHeader('NEVER', req, res);
                }

                res.redirect(redirectUrl);
            } else {
                res.end();
            }
        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
