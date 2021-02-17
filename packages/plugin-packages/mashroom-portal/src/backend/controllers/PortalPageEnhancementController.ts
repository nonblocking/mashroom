
import {getResourceAsStream} from '../utils/resource_utils';

import type {Request, Response} from 'express';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';
import type {MashroomPortalPageEnhancement, MashroomPortalPageEnhancementResource} from '../../../type-definitions';

export default class PortalPageEnhancementController {

    constructor(private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async getPortalPageResource(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        const pluginName = req.params.pluginName;
        const resourcePath = req.params['0'];

        const plugin = this._pluginRegistry.portalPageEnhancements.find((plugin) => plugin.name === pluginName);
        if (!plugin) {
            logger.error('Request for resource of unknown page enhancement plugin: ', pluginName);
            res.sendStatus(404);
            return;
        }

        const resourceJs = plugin.pageResources && plugin.pageResources.js && plugin.pageResources.js.find((res) => res.path === resourcePath);
        const resourceCss = plugin.pageResources && plugin.pageResources.css && plugin.pageResources.css.find((res) => res.path === resourcePath);
        if (!resourceJs && !resourceCss) {
            logger.error(`Request for unknown resource '${resourcePath}' of page enhancement plugin: ${pluginName}`);
            res.sendStatus(404);
            return;
        }

        await this._sendResource(resourceJs ? 'js' : 'css', resourceJs || resourceCss, plugin, req, res);
    }

    private async _sendResource(type: 'js' | 'css', resource: MashroomPortalPageEnhancementResource | undefined,
                               plugin: MashroomPortalPageEnhancement, req: Request, res: Response) {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache && req.pluginContext.services.browserCache.cacheControl;

        if (!resource || !resource.path) {
            res.sendStatus(404);
            return;
        }

        if (cacheControlService) {
            await cacheControlService.addCacheControlHeader(false, req, res);
        }

        const resourceUri = `${plugin.resourcesRootUri}/${resource.path}`;
        logger.debug(`Sending page enhancement resource: ${resourceUri}`);

        try {
            const rs = await getResourceAsStream(resourceUri);
            res.type(type === 'js' ? 'text/javascript' : 'text/css');
            rs.pipe(res);

            return true;

        } catch (err) {
            logger.error(`Cannot load page enhancement resource: ${resourceUri}`, err);
            if (cacheControlService) {
                cacheControlService.removeCacheControlHeader(res);
            }
            if (err.code === 'ENOTFOUND') {
                res.sendStatus(404);
            } else {
                res.sendStatus(500);
            }
        }
    }
}
