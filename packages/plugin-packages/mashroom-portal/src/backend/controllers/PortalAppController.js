// @flow

import {promisify} from 'util';
import getUriCbStyle from 'get-uri';
import {userAndAgentContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import {portalAppContext} from '../utils/logging_utils';

const getUri = promisify(getUriCbStyle);

import {
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_APP_RESOURCES_GLOBAL_PATH,
    PORTAL_APP_REST_PROXY_BASE_PATH,
    PORTAL_PRIVATE_PATH
} from '../constants';
import {getPortalPath} from '../utils/path_utils';
import {findPortalAppInstanceOnPage} from '../utils/model_utils';
import {isAppPermitted, getPortalAppResourceKey, calculatePermissions} from '../utils/security_utils';

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
    MashroomPortalPluginRegistry,
    MashroomAvailablePortalApp,
    MashroomPortalAppInstance,
    MashroomPortalService,
    MashroomPortalAppUserPermissions,
    MashroomPortalAppUser,
} from '../../../type-definitions';

export default class PortalAppController {

    pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this.pluginRegistry = pluginRegistry;
    }

    async getPortalAppSetup(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');
        let contextLogger = logger.withContext(userAndAgentContext(req));
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        try {
            const pageId: any = req.params.pageId;
            const pluginName = req.params.pluginName;
            const portalAppInstanceId = req.params.portalAppInstanceId;

            if (!await isAppPermitted(req, pluginName, portalAppInstanceId)) {
                res.sendStatus(403);
                return;
            }

            const portalApp = this._getPortalApp(pluginName);
            if (!portalApp) {
                contextLogger.error(`Portal app not found: ${pluginName}`);
                res.sendStatus(404);
                return;
            }

            contextLogger = contextLogger.withContext(portalAppContext(portalApp));
            let portalAppInstance = null;

            if (portalAppInstanceId) {
                portalAppInstance = await this._getPortalAppInstance(pageId, portalApp, portalAppInstanceId, req);
            } else {
                portalAppInstance = await this._getGlobalPortalAppInstance(portalApp, req, logger);
            }
            if (!portalAppInstance) {
                contextLogger.warn(`Portal app instance not found: ${portalAppInstanceId}`);
                res.sendStatus(404);
                return;
            }

            let portalPath = getPortalPath(req, contextLogger);

            const encodedPortalAppName = encodeURIComponent(portalApp.name);
            const resourcesBasePath = `${portalPath}${PORTAL_PRIVATE_PATH}${PORTAL_APP_RESOURCES_BASE_PATH}/${encodedPortalAppName}`;
            const globalResourcesBasePath = `${portalPath}${PORTAL_PRIVATE_PATH}${PORTAL_APP_RESOURCES_BASE_PATH}${PORTAL_APP_RESOURCES_GLOBAL_PATH}`;
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
                resourcesBasePath,
                globalResourcesBasePath,
                resources: portalApp.resources,
                globalLaunchFunction: portalApp.globalLaunchFunction,
                lang,
                user,
                appConfig
            };

            contextLogger.info(`Sending portal app: ${portalApp.name}`);

            res.json(portalAppSetup);

        } catch (e) {
            contextLogger.error(e);
            res.sendStatus(500);
        }
    }

    async getPortalAppResource(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache && req.pluginContext.services.browserCache.cacheControl;

        try {
            const pluginName = req.params.pluginName;
            const resourcePath = req.params['0'];
            const fileName = resourcePath.split('/').pop();

            const portalApp = this._getPortalApp(pluginName);
            if (!portalApp) {
                logger.warn(`Portal app not found: ${pluginName}`);
                res.sendStatus(404);
                return;
            }

            if (cacheControlService) {
                await cacheControlService.addCacheControlHeader(req, res);
            }

            const resourceUri = portalApp.resourcesRootUri + '/' + resourcePath;
            logger.debug(`Sending app resource: ${resourceUri}`);

            try {
                const rs: ReadStream = await getUri(resourceUri);
                res.type(fileName);
                rs.pipe(res);
            } catch (err) {
                logger.error(`Cannot load app resource: ${resourceUri}`, err);
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

    async getGlobalPortalAppResource(req: ExpressRequest, res: ExpressResponse) {

        // TODO
        res.sendStatus(501);
    }

    getAvailablePortalApps(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');
        const {q, updatedSince} = req.query;

        let apps: Array<MashroomAvailablePortalApp> = this.pluginRegistry.portalApps.map((a) => ({
            name: a.name,
            description: a.description,
            category: a.category,
            lastReloadTs: a.lastReloadTs,
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

    async _getGlobalPortalAppInstance(portalApp: MashroomPortalApp, req: ExpressRequest, logger: MashroomLogger) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
        const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

        const appInstance = await portalService.getPortalAppInstance(portalApp.name, null);
        if (appInstance) {
            return appInstance;
        }

        logger.info(`Creating new default instance for global app: ${portalApp.name}`);
        const newDefaultInstance: MashroomPortalAppInstance = {
            pluginName: portalApp.name,
            instanceId: null,
            appConfig: portalApp.defaultAppConfig,
        };

        await portalService.insertPortalAppInstance(newDefaultInstance);

        if (portalApp.defaultRestrictedToRoles && Array.isArray(portalApp.defaultRestrictedToRoles)) {
            await securityService.updateResourcePermission(req, {
                type: 'Portal-App',
                key: getPortalAppResourceKey(portalApp.name, null),
                permissions: [{
                    permissions: ['View'],
                    roles: portalApp.defaultRestrictedToRoles || []
                }]
            });
        }

        return newDefaultInstance;
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
