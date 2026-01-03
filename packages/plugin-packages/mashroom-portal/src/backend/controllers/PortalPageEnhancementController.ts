import {isTimeoutError, isNotFoundError, streamResource} from '../utils/resource-utils';

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
        const resourcePathSegments = req.params.resourcePath as unknown as Array<string>;
        const resourcePath = resourcePathSegments.join('/');

        const plugin = this._pluginRegistry.portalPageEnhancements.find((plugin) => plugin.name === pluginName);
        if (!plugin) {
            logger.error('Request for resource of unknown page enhancement plugin: ', pluginName);
            res.sendStatus(404);
            return;
        }

        const resourceJs = plugin.pageResources && plugin.pageResources.js && plugin.pageResources.js.find(
            (res) => res.path === resourcePath || `${res.path}.map` === resourcePath);
        const resourceCss = plugin.pageResources && plugin.pageResources.css && plugin.pageResources.css.find(
            (res) => res.path === resourcePath || `${res.path}.map` === resourcePath);
        if (!resourceJs && !resourceCss) {
            logger.error(`Request for unknown resource '${resourcePath}' of page enhancement plugin: ${pluginName}`);
            res.sendStatus(404);
            return;
        }

        await this._sendResource(resourcePath, plugin, req, res);
    }

    private async _sendResource(resourcePath: string, plugin: MashroomPortalPageEnhancement, req: Request, res: Response) {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        if (cacheControlService) {
            cacheControlService.addCacheControlHeader('SHARED', req, res);
        }

        const resourceUri = `${plugin.resourcesRootUrl}/${resourcePath}`;
        logger.debug(`Sending page enhancement resource: ${resourceUri}`);

        try {
            await streamResource(resourceUri, res, logger);
            return true;
        } catch (err: any) {
            logger.error(`Cannot load page enhancement resource: ${resourceUri}`, err);
            if (!res.headersSent) {
                if (cacheControlService) {
                    cacheControlService.removeCacheControlHeader(res);
                }
                if (isNotFoundError(err)) {
                    res.sendStatus(404);
                } else if (isTimeoutError(err)) {
                    res.sendStatus(504); // Gateway Timeout
                } else {
                    res.sendStatus(502); // Bad Gateway
                }
            }
        }
    }
}
