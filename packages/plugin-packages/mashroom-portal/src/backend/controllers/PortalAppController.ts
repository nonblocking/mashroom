
import {portalAppContext} from '../utils/logging_utils';
import {getResourceAsStream} from '../utils/resource_utils';
import {getFrontendApiResourcesBasePath, getSitePath} from '../utils/path_utils';
import {findPortalAppInstanceOnPage, getPage} from '../utils/model_utils';
import {
    getUser,
    isAppPermitted,
    isPagePermitted,
    isSitePathPermitted
} from '../utils/security_utils';
import createPortalAppSetup from '../utils/create_portal_app_setup';
import {PORTAL_APP_RESOURCES_BASE_PATH} from '../constants';

import type {Request, Response} from 'express';
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

    constructor(private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async getPortalAppSetup(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const sitePath = getSitePath(req);
            const pageId = req.params.pageId as string;
            const pluginName = req.params.pluginName;
            const portalAppInstanceId = req.params.portalAppInstanceId;
            const mashroomSecurityUser = await getUser(req);

            if (!await isSitePathPermitted(req, sitePath)) {
                logger.error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access site: ${sitePath}`);
                res.sendStatus(403);
                return;
            }
            if (!await isPagePermitted(req, pageId)) {
                logger.error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access page: ${pageId}`);
                res.sendStatus(403);
                return;
            }

            const page = await getPage(req, pageId);
            if (!page) {
                logger.error(`Portal page not found: ${pageId}`);
                res.sendStatus(404);
                return;
            }

            const portalApp = this._getPortalApp(pluginName);
            if (!portalApp) {
                logger.error(`Portal app not found: ${pluginName}`);
                res.sendStatus(404);
                return;
            }
            if (!await isAppPermitted(req, pluginName, portalAppInstanceId, portalApp)) {
                logger.error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access app: ${pluginName}:${portalAppInstanceId}`);
                res.sendStatus(403);
                return;
            }

            logger.addContext(portalAppContext(portalApp));
            let portalAppInstance;

            if (portalAppInstanceId) {
                portalAppInstance = await this._getPortalAppInstance(page, portalApp, portalAppInstanceId, req);
            } else {
                portalAppInstance = await this._getDynamicallyLoadedPortalAppInstance(portalApp, req);
            }
            if (!portalAppInstance) {
                logger.warn(`Portal app instance not found: ${portalAppInstanceId}`);
                res.sendStatus(404);
                return;
            }

            const portalAppSetup = await createPortalAppSetup(portalApp, portalAppInstance, mashroomSecurityUser, this._pluginRegistry, req);

            logger.debug(`Sending portal app setup for: ${portalApp.name}`, portalAppSetup);

            res.json(portalAppSetup);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPortalAppResource(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        const pluginName = req.params.pluginName;
        const resourcePath = req.params['0'];

        const portalApp = this._getPortalApp(pluginName);
        if (!portalApp) {
            logger.warn(`Portal app not found: ${pluginName}`);
            res.sendStatus(404);
            return;
        }

        logger.addContext(portalAppContext(portalApp));

        await this._sendResource(resourcePath, portalApp, false, req, res);
    }

    async getSharedPortalAppResource(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

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
        const portalApps = this._pluginRegistry.portalApps.filter((portalApp) =>
            // @ts-ignore
            portalApp.sharedResources && portalApp.sharedResources[resourceType] && portalApp.sharedResources[resourceType].find((res) => res === resourcePath));

        let sent = false;
        while (portalApps.length > 0 && !sent) {
            const portalApp = portalApps.pop();
            if (portalApp) {
                logger.debug(`Taking the shared resource ${resourcePath} from portal app: ${portalApp.name}`);
                sent = await this._sendResource(resourcePath, portalApp, true, req, res);
            }
        }

        if (!sent) {
            logger.error('Shared resource not found: ', resourcePath);
            res.sendStatus(404);
        }
    }

    async getAvailablePortalApps(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const mashroomSecurityUser = await getUser(req);
        const {q, updatedSince} = req.query;

        let apps: Array<MashroomAvailablePortalApp> = this._pluginRegistry.portalApps
            .filter((portalApp) => {
                // Remove Apps the user could not load anyways
                if (Array.isArray(portalApp.defaultRestrictViewToRoles) && portalApp.defaultRestrictViewToRoles.length > 0) {
                    return portalApp.defaultRestrictViewToRoles.some((r) => mashroomSecurityUser?.roles?.find((ur) => ur === r));
                }
                return true;
            })
            .map((portalApp) => {
                const encodedPortalAppName = encodeURIComponent(portalApp.name);
                const resourcesBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_APP_RESOURCES_BASE_PATH}/${encodedPortalAppName}`;
                const screenshots = (portalApp.screenshots || []).map((path) => `${resourcesBasePath}${path}`);
                return {
                    name: portalApp.name,
                    category: portalApp.category,
                    description: portalApp.description,
                    tags: portalApp.tags,
                    screenshots,
                    metaInfo: portalApp.metaInfo,
                    lastReloadTs: portalApp.lastReloadTs,
                }
            });

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

    private _getPortalApp(pluginName: string) {
        return this._pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

    private async _getPortalAppInstance(page: MashroomPortalPage, portalApp: MashroomPortalApp, instanceId: string, req: Request) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

        const instData = findPortalAppInstanceOnPage(page, portalApp.name, instanceId);

        if (!instData) {
            return null;
        }

        return portalService.getPortalAppInstance(portalApp.name, instanceId);
    }

    private async _getDynamicallyLoadedPortalAppInstance(portalApp: MashroomPortalApp, req: Request) {
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

    private async _sendResource(resourcePath: string, portalApp: MashroomPortalApp, shared: boolean, req: Request, res: Response): Promise<boolean> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        if (cacheControlService) {
            cacheControlService.addCacheControlHeader(shared ? 'SHARED' : 'PRIVATE_IF_AUTHENTICATED', req, res);
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
