
import {portalAppContext} from '../utils/logging_utils';
import {getResourceAsStream} from '../utils/resource_utils';
import {getSitePath} from '../utils/path_utils';
import {findPortalAppInstanceOnPage, getPage} from '../utils/model_utils';
import {
    getUser,
    isAppPermitted,
    isPagePermitted,
    isSitePathPermitted
} from '../utils/security_utils';
import createPortalAppSetup from '../utils/create_portal_app_setup';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger,} from '@mashroom/mashroom/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {
    MashroomAvailablePortalApp,
    MashroomPortalApp,
    MashroomPortalAppInstance,
    MashroomPortalService,
    MashroomPortalPage,
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalAppController {

    constructor(private pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async getPortalAppSetup(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const sitePath = getSitePath(reqWithContext);
            const pageId = req.params.pageId as string;
            const pluginName = req.params.pluginName;
            const portalAppInstanceId = req.params.portalAppInstanceId;
            const mashroomSecurityUser = await getUser(reqWithContext);

            if (!await isSitePathPermitted(reqWithContext, sitePath)) {
                logger.error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access site: ${sitePath}`);
                res.sendStatus(403);
                return;
            }
            if (!await isPagePermitted(reqWithContext, pageId)) {
                logger.error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access page: ${pageId}`);
                res.sendStatus(403);
                return;
            }

            const page = await getPage(reqWithContext, pageId);
            if (!page) {
                logger.error(`Portal page not found: ${pageId}`);
                res.sendStatus(404);
                return;
            }

            const portalApp = this.getPortalApp(pluginName);
            if (!portalApp) {
                logger.error(`Portal app not found: ${pluginName}`);
                res.sendStatus(404);
                return;
            }
            if (!await isAppPermitted(reqWithContext, pluginName, portalAppInstanceId, portalApp)) {
                logger.error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access app: ${pluginName}:${portalAppInstanceId}`);
                res.sendStatus(403);
                return;
            }

            logger.addContext(portalAppContext(portalApp));
            let portalAppInstance;

            if (portalAppInstanceId) {
                portalAppInstance = await this.getPortalAppInstance(page, portalApp, portalAppInstanceId, reqWithContext);
            } else {
                portalAppInstance = await this.getDynamicallyLoadedPortalAppInstance(portalApp, reqWithContext);
            }
            if (!portalAppInstance) {
                logger.warn(`Portal app instance not found: ${portalAppInstanceId}`);
                res.sendStatus(404);
                return;
            }

            const portalAppSetup = await createPortalAppSetup(portalApp, portalAppInstance, mashroomSecurityUser, this.pluginRegistry, reqWithContext);

            logger.debug(`Sending portal app setup for: ${portalApp.name}`, portalAppSetup);

            res.json(portalAppSetup);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPortalAppResource(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        const pluginName = req.params.pluginName;
        const resourcePath = req.params['0'];

        const portalApp = this.getPortalApp(pluginName);
        if (!portalApp) {
            logger.warn(`Portal app not found: ${pluginName}`);
            res.sendStatus(404);
            return;
        }

        logger.addContext(portalAppContext(portalApp));

        await this.sendResource(resourcePath, portalApp, reqWithContext, res);
    }

    async getSharedPortalAppResource(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        const typeAndResourcePath = req.params['0'];
        const parts = typeAndResourcePath.split('/');
        if (parts.length < 2 || ['js', 'css'].indexOf(parts[0]) === -1) {
            logger.error('Invalid shared resource: ', typeAndResourcePath);
            res.sendStatus(404);
            return;
        }

        const resourceType = parts[0];
        const resourcePath = parts.slice(1).join('/');

        // Find portal apps that provide the shared resource
        const portalApps = this.pluginRegistry.portalApps.filter((portalApp) =>
            // @ts-ignore
            portalApp.sharedResources && portalApp.sharedResources[resourceType] && portalApp.sharedResources[resourceType].find((res) => res === resourcePath));

        let sent = false;
        while (portalApps.length > 0 && !sent) {
            const portalApp = portalApps.pop();
            if (portalApp) {
                logger.debug(`Taking the shared resource ${resourcePath} from portal app: ${portalApp.name}`);
                sent = await this.sendResource(resourcePath, portalApp, reqWithContext, res);
            }
        }

        if (!sent) {
            logger.error('Shared resource not found: ', resourcePath);
            res.sendStatus(404);
        }
    }

    getAvailablePortalApps(req: Request, res: Response): void {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');
        const {q, updatedSince} = req.query;

        let apps: Array<MashroomAvailablePortalApp> = this.pluginRegistry.portalApps.map((app) => ({
            name: app.name,
            description: app.description,
            tags: app.tags,
            category: app.category,
            lastReloadTs: app.lastReloadTs,
        }));

        if (typeof (q) === 'string') {
            apps = apps.filter((app) => app.name.toLowerCase().indexOf(q.toLowerCase()) !== -1 || (app.description && app.description.toLowerCase().indexOf(q.toLowerCase()) !== -1));
        }
        if (typeof (updatedSince) === 'string') {
            try {
                const updatedSinceTs = parseInt(updatedSince);
                apps = apps.filter((app) => app.lastReloadTs > updatedSinceTs);
            } catch (e) {
                apps = [];
                logger.error(`Invalid updatedSince timestamp: ${updatedSince}`);
            }
        }

        res.json(apps);
    }

    private getPortalApp(pluginName: string) {
        return this.pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

    private async getPortalAppInstance(page: MashroomPortalPage, portalApp: MashroomPortalApp, instanceId: string, req: ExpressRequest) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

        const instData = findPortalAppInstanceOnPage(page, portalApp.name, instanceId);

        if (!instData) {
            return null;
        }

        return portalService.getPortalAppInstance(portalApp.name, instanceId);
    }

    private async getDynamicallyLoadedPortalAppInstance(portalApp: MashroomPortalApp, req: ExpressRequest) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

        // Maybe there was created a instance in the storage
        const appInstance = await portalService.getPortalAppInstance(portalApp.name, null);
        if (appInstance) {
            return appInstance;
        }

        const globalAppInstance: MashroomPortalAppInstance = {
            pluginName: portalApp.name,
            instanceId: null,
            appConfig: portalApp.defaultAppConfig,
        };

        return globalAppInstance;
    }

    private async sendResource(resourcePath: string, portalApp: MashroomPortalApp, req: ExpressRequest, res: Response): Promise<boolean> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache && req.pluginContext.services.browserCache.cacheControl;

        if (cacheControlService) {
            await cacheControlService.addCacheControlHeader(false, req, res);
        }

        const resourceUri = `${portalApp.resourcesRootUri}/${resourcePath}`;
        logger.debug(`Sending portal app resource: ${resourceUri}`);

        try {
            const fileName = resourcePath.split('/').pop() as string;

            const rs = await getResourceAsStream(resourceUri);
            res.type(fileName);
            rs.pipe(res);

            return true;

        } catch (err) {
            logger.error(`Cannot load portal app resource: ${resourceUri}`, err);
            if (cacheControlService) {
                cacheControlService.removeCacheControlHeader(res);
            }
            if (err.code === 'ENOTFOUND') {
                res.sendStatus(404);
            } else {
                res.sendStatus(500);
            }
        }

        return false;
    }

}
