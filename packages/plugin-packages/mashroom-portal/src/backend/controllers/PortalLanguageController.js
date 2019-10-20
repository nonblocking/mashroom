// @flow

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';

export default class PortalLanguageController {

    async getAvailableLanguages(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

            res.json(i18nService.availableLanguages);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getDefaultLanguage(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

            res.json(i18nService.defaultLanguage);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
