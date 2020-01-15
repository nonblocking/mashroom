// @flow

import {promisify} from 'util';
import getUriCbStyle from 'get-uri';
import {portalAppContext} from '../utils/logging_utils';

const getUri = promisify(getUriCbStyle);

import {
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_APP_RESOURCES_SHARED_PATH,
    PORTAL_APP_REST_PROXY_BASE_PATH,
    PORTAL_PRIVATE_PATH
} from '../constants';
import {getPortalPath} from '../utils/path_utils';
import {findPortalAppInstanceOnPage} from '../utils/model_utils';
import {isAppPermitted, calculatePermissions} from '../utils/security_utils';

import type {ReadStream} from 'fs';
import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityService,
    MashroomSecurityUser,
} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {
    MashroomPortalAppSetup,
    MashroomPortalApp,
    MashroomAvailablePortalApp,
    MashroomPortalAppInstance,
    MashroomPortalService,
    MashroomPortalAppUserPermissions,
    MashroomPortalAppUser,
} from '../../../type-definitions';
import type {
    MashroomPortalPluginRegistry,
} from '../../../type-definitions/internal';

export default class PortalAppController {

    pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this.pluginRegistry = pluginRegistry;
    }

    async getPortalAppSetup(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        try {
            const pageId: any = req.params.pageId;
            const pluginName = req.params.pluginName;
            const portalAppInstanceId = req.params.portalAppInstanceId;

            const portalApp = this._getPortalApp(pluginName);
            if (!portalApp) {
                logger.error(`Portal app not found: ${pluginName}`);
                res.sendStatus(404);
                return;
            }
            if (!await isAppPermitted(req, pluginName, portalAppInstanceId, portalApp)) {
                res.sendStatus(403);
                return;
            }

            logger.addContext(portalAppContext(portalApp));
            let portalAppInstance = null;

            if (portalAppInstanceId) {
                portalAppInstance = await this._getPortalAppInstance(pageId, portalApp, portalAppInstanceId, req);
            } else {
                portalAppInstance = await this._getDynamicallyLoadedPortalAppInstance(portalApp, req);
            }
            if (!portalAppInstance) {
                logger.warn(`Portal app instance not found: ${portalAppInstanceId}`);
                res.sendStatus(404);
                return;
            }

            let portalPath = getPortalPath();

            const encodedPortalAppName = encodeURIComponent(portalApp.name);
            const resourcesBasePath = `${portalPath}${PORTAL_PRIVATE_PATH}${PORTAL_APP_RESOURCES_BASE_PATH}/${encodedPortalAppName}`;
            const sharedResourcesBasePath = `${portalPath}${PORTAL_PRIVATE_PATH}${PORTAL_APP_RESOURCES_BASE_PATH}${PORTAL_APP_RESOURCES_SHARED_PATH}`;
            const restProxyBasePath = `${portalPath}${PORTAL_PRIVATE_PATH}${PORTAL_APP_REST_PROXY_BASE_PATH}/${encodedPortalAppName}`;
            const restProxyPaths = {};
            if (portalApp.restProxies) {
                for (const proxyId in portalApp.restProxies) {
                    if (portalApp.restProxies.hasOwnProperty(proxyId)) {
                        restProxyPaths[proxyId] = `${restProxyBasePath}/${proxyId}`;
                    }
                }
            }

            const lang = await this._getLang(req);
            const user = await this._getUser(req, portalApp);

            const appConfig = Object.assign({}, portalApp.defaultAppConfig, portalAppInstance.appConfig);

            const portalAppSetup: MashroomPortalAppSetup = {
                pluginName: portalApp.name,
                title: portalApp.title ? i18nService.translate(req, portalApp.title) : null,
                version: portalApp.version,
                instanceId: portalAppInstance.instanceId,
                lastReloadTs: portalApp.lastReloadTs,
                restProxyPaths,
                sharedResourcesBasePath,
                sharedResources: portalApp.sharedResources,
                resourcesBasePath,
                resources: portalApp.resources,
                globalLaunchFunction: portalApp.globalLaunchFunction,
                lang,
                user,
                appConfig
            };

            logger.info(`Sending portal app setup for: ${portalApp.name}`);

            res.json(portalAppSetup);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPortalAppResource(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        const pluginName = req.params.pluginName;
        const resourcePath = req.params['0'];

        const portalApp = this._getPortalApp(pluginName);
        if (!portalApp) {
            logger.warn(`Portal app not found: ${pluginName}`);
            res.sendStatus(404);
            return;
        }

        logger.addContext(portalAppContext(portalApp));

        await this._sendResource(resourcePath, portalApp, req, res);
    }

    async getSharedPortalAppResource(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

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
            portalApp.sharedResources && portalApp.sharedResources[resourceType] && portalApp.sharedResources[resourceType].find((js) => js === resourcePath));

        let sent = false;
        while (portalApps.length > 0 && !sent) {
            const portalApp = portalApps.pop();
            logger.debug(`Take the shared resource ${resourcePath} from portal app: ${portalApp.name}`);
            sent = await this._sendResource(resourcePath, portalApp, req, res);
        }

        if (!sent) {
            logger.error('Shared resource not found: ', resourcePath);
            res.sendStatus(404);
        }
    }

    getAvailablePortalApps(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');
        const {q, updatedSince} = req.query;

        let apps: Array<MashroomAvailablePortalApp> = this.pluginRegistry.portalApps.map((app) => ({
            name: app.name,
            description: app.description,
            tags: app.tags,
            category: app.category,
            lastReloadTs: app.lastReloadTs,
        }));

        if (typeof(q) === 'string') {
            apps = apps.filter((app) => app.name.toLowerCase().indexOf(q.toLowerCase()) !== -1 || (app.description && app.description.toLowerCase().indexOf(q.toLowerCase()) !== -1));
        }
        if (typeof(updatedSince) === 'string') {
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

    _getPortalApp(pluginName: string) {
        return this.pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

    async _getPortalAppInstance(pageId: string, portalApp: MashroomPortalApp, instanceId: string, req: ExpressRequest) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

        const page = await portalService.getPage(pageId);
        if (!page || !page.portalApps) {
            return null;
        }

        const instData = findPortalAppInstanceOnPage(page, portalApp.name, instanceId);

        if (!instData) {
            return null;
        }

        return portalService.getPortalAppInstance(portalApp.name, instanceId);
    }

    async _getDynamicallyLoadedPortalAppInstance(portalApp: MashroomPortalApp, req: ExpressRequest) {
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

    async _sendResource(resourcePath: string, portalApp: MashroomPortalApp, req: ExpressRequest, res: ExpressResponse): Promise<boolean> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache && req.pluginContext.services.browserCache.cacheControl;

        if (cacheControlService) {
            await cacheControlService.addCacheControlHeader(req, res);
        }

        const resourceUri = portalApp.resourcesRootUri + '/' + resourcePath;
        logger.debug(`Sending portal app resource: ${resourceUri}`);

        try {
            const fileName = resourcePath.split('/').pop();

            const rs: ReadStream = await getUri(resourceUri);
            res.type(fileName);
            rs.pipe(res);

            return true;

        } catch (err) {
            logger.error(`Cannot load portal app resource: ${resourceUri}`, err);
            if (cacheControlService) {
                cacheControlService.removeCacheControlHeader(res);
            }
            res.sendStatus(500);
        }

        return false;
    }

    async _getLang(req: ExpressRequest) {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;
        return i18nService.getLanguage(req);
    }

    async _getUser(req: ExpressRequest, portalApp: MashroomPortalApp) {
        const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
        const user: ?MashroomSecurityUser = securityService.getUser(req);

        const permissions: MashroomPortalAppUserPermissions = calculatePermissions(portalApp.rolePermissions, user);

        const portalUser: MashroomPortalAppUser = {
            guest: !user,
            username: user ? user.username : 'anonymous',
            displayName: user ? user.displayName || user.username : 'Anonymous',
            permissions
        };

        return portalUser;
    }
}
