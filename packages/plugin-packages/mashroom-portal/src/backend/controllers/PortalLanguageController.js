// @flow

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';

type NewLanguage = {
    lang: string
}

export default class PortalLanguageController {

    async setUserLanguage(req: ExpressRequest, res: ExpressResponse) {
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
