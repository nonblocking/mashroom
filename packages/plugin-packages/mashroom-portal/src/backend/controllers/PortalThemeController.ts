
import {isAdmin} from '../utils/security_utils';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {MashroomAvailablePortalTheme} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalThemeController {

    constructor(private pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async getPortalThemeResource(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = reqWithContext.pluginContext.services.browserCache && reqWithContext.pluginContext.services.browserCache.cacheControl;

        try {
            const themeName = req.params.themeName;
            const resourcePath = req.params['0'];

            const theme = this.getPortalTheme(themeName);
            if (!theme) {
                logger.warn(`Theme not found: ${themeName}`);
                res.sendStatus(404);
                return;
            }

            const resourceFile = `${theme.resourcesRootPath}/${resourcePath}`;
            logger.debug(`Sending theme resource: ${resourceFile}`);

            if (cacheControlService) {
                await cacheControlService.addCacheControlHeader(false, reqWithContext, res);
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

    async getAvailablePortalThemes(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            if (!isAdmin(reqWithContext)) {
                res.sendStatus(403);
                return;
            }

            const availableThemes: Array<MashroomAvailablePortalTheme> = this.pluginRegistry.themes.map((t) => ({
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

    private getPortalTheme(themeName: string) {
        return this.pluginRegistry.themes.find((th) => th.name === themeName);
    }
}
