
import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';

export default class PortalLanguageController {

    async getAvailableLanguages(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const i18nService: MashroomI18NService = reqWithContext.pluginContext.services.i18n.service;

            res.json(i18nService.availableLanguages);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getDefaultLanguage(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const i18nService: MashroomI18NService = reqWithContext.pluginContext.services.i18n.service;

            res.json(i18nService.defaultLanguage);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
