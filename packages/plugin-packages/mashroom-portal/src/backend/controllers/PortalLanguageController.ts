
import type {Request, Response} from 'express';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';

export default class PortalLanguageController {

    async getAvailableLanguages(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        try {
            const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

            if (cacheControlService) {
                cacheControlService.addCacheControlHeader('SHARED', req, res);
            }

            res.json(i18nService.availableLanguages);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getDefaultLanguage(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        try {
            const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

            if (cacheControlService) {
                cacheControlService.addCacheControlHeader('SHARED', req, res);
            }

            res.json(i18nService.defaultLanguage);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
