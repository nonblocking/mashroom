// @flow

import {isAdmin} from '../utils/security_utils';

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {MashroomAvailablePortalTheme} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalThemeController {

    _pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this._pluginRegistry = pluginRegistry;
    }

    async getPortalThemeResource(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache && req.pluginContext.services.browserCache.cacheControl;

        try {
            const themeName = req.params.themeName;
            const resourcePath = req.params['0'];

            const theme = this._getPortalTheme(themeName);
            if (!theme) {
                logger.warn(`Theme not found: ${themeName}`);
                res.sendStatus(404);
                return;
            }

            const resourceFile = `${theme.resourcesRootPath}/${resourcePath}`;
            logger.debug(`Sending theme resource: ${resourceFile}`);

            if (cacheControlService) {
                await cacheControlService.addCacheControlHeader(req, res);
            }

            try {
                res.sendFile(resourceFile);
            } catch (err) {
                logger.error(`Cannot load theme resource: ${resourceFile}`, err);
                if (cacheControlService) {
                    cacheControlService.removeCacheControlHeader(res);
                }
                res.sendStatus(500);
            }

        } catch (e) {
            logger.error(e);
            if (cacheControlService) {
                cacheControlService.removeCacheControlHeader(res);
            }
            res.sendStatus(500);
        }
    }

    async getAvailablePortalThemes(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const availableThemes: Array<MashroomAvailablePortalTheme> = this._pluginRegistry.themes.map((t) => ({
                name: t.name,
                description: t.description,
                lastReloadTs: t.lastReloadTs
            }));

            res.json(availableThemes);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    _getPortalTheme(themeName: string) {
        return this._pluginRegistry.themes.find((th) => th.name === themeName);
    }
}
