import {fileTypeUtils} from '@mashroom/mashroom-utils';
import {portalAppContext} from '../utils/logging-utils';
import {streamResource, isNotFoundError, isTimeoutError} from '../utils/resource-utils';
import {getFrontendResourcesBasePath, getSitePath} from '../utils/path-utils';
import {findPortalAppInstanceOnPage, getPage} from '../utils/model-utils';
import {
    getUser,
    isAdmin,
    isAppPermitted,
    isPagePermitted,
    isSitePathPermitted
} from '../utils/security-utils';
import {createPortalAppSetup, createPortalAppSetupForMissingPlugin} from '../utils/create-portal-app-setup';
import {PORTAL_APP_RESOURCES_BASE_PATH} from '../constants';

import type {Request, Response} from 'express';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {MashroomCDNService} from '@mashroom/mashroom-cdn/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {
    MashroomPortalApp,
    MashroomPortalAppInstance,
    MashroomPortalService,
    MashroomPortalPage,
    MashroomKnownPortalApp,
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalAppController {

    constructor(private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async getPortalAppSetup(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;
        const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;

        try {
            const sitePath = getSitePath(req);
            const pageId = req.params.pageId as string;
            const pluginName = req.params.pluginName;
            const portalAppInstanceId = req.params.portalAppInstanceId;
            const mashroomSecurityUser = getUser(req);

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
                const appSetup = await createPortalAppSetupForMissingPlugin(pluginName, undefined, mashroomSecurityUser, req);
                res.json(appSetup);
                return;
            }

            if (!await isAppPermitted(req, pluginName, portalAppInstanceId, portalApp)) {
                logger.error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access Portal App: ${pluginName}:${portalAppInstanceId}`);
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
                logger.warn(`Portal App instance not found: ${portalAppInstanceId}`);
                res.sendStatus(404);
                return;
            }

            const portalAppSetup = await createPortalAppSetup(portalApp, portalAppInstance, null, mashroomSecurityUser, cdnService, this._pluginRegistry, req);

            logger.debug(`Sending Portal App setup for: ${portalApp.name}`, portalAppSetup);

            if (cacheControlService) {
                // Never cache dynamically loaded apps because they need a different appId per instance
                cacheControlService.addCacheControlHeader(portalAppInstanceId ? 'PRIVATE_IF_AUTHENTICATED' : 'NEVER', req, res);
            }

            res.json(portalAppSetup);

        } catch (e: any) {
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
            logger.warn(`Portal App not found: ${pluginName}`);
            res.sendStatus(404);
            return;
        }

        logger.addContext(portalAppContext(portalApp));

        await this._sendResource(resourcePath, portalApp, req, res);
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

        const resourceType = parts[0] as 'css' | 'js';
        const resourcePath = parts.slice(1).join('/');

        // Find Portal Apps that provide the shared resource
        const portalApps = this._pluginRegistry.portalApps.filter((portalApp) => {
            return portalApp.sharedResources?.[resourceType]?.find((res) => {
                if (res === resourcePath) {
                    return true;
                }
                if (resourceType === 'js') {
                    // The resourcePath could be a chunk in the form of <base-resource-name>.<chunk-id>.js
                    const parts = resourcePath.split('.');
                    if (parts.length > 2) {
                        const baseResourcePath = [parts.slice(0, parts.length - 2), 'js'].join('.');
                        if (res === baseResourcePath) {
                            return true;
                        }
                    }
                }
                return false;
            });
        });

        let sent = false;
        while (portalApps.length > 0 && !sent) {
            const portalApp = portalApps.pop();
            if (portalApp) {
                logger.debug(`Taking the shared resource ${resourcePath} from Portal App: ${portalApp.name}`);
                sent = await this._sendResource(resourcePath, portalApp, req, res);
            }
        }

        if (!sent) {
            logger.error('Shared resource not found: ', resourcePath);
            res.sendStatus(404);
        }
    }

    async getKnownPortalApps(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n!.service;
        const mashroomSecurityUser = getUser(req);
        const admin = isAdmin(req);
        const {q: qRaw, updatedSince: updatedSinceRaw, includeNotPermitted} = req.query;

        const q = typeof qRaw === 'string' ? qRaw : undefined;
        let updatedSince: number | undefined;
        if (typeof updatedSinceRaw === 'string') {
            try {
                updatedSince = parseInt(updatedSinceRaw);
            } catch(e) {
                logger.warn(`Invalid updatedSince timestamp: ${updatedSince}`, e);
            }
        }

        let apps: Array<MashroomKnownPortalApp> = this._pluginRegistry.portalApps
            .filter((portalApp) => {
                if (q) {
                    let titles = '';
                    let descriptions = '';
                    let tags = '';
                    if (portalApp.title) {
                        if (typeof portalApp.title === 'string') {
                            titles = portalApp.title;
                        } else {
                            titles = Object.values(portalApp.title).join(' ');
                        }
                    }
                    if (portalApp.description) {
                        if (typeof portalApp.description === 'string') {
                            descriptions = portalApp.description;
                        } else {
                            descriptions = Object.values(portalApp.description).join(' ');
                        }
                    }
                    if (Array.isArray(portalApp.tags)) {
                        tags = portalApp.tags.join(' ');
                    }
                    return portalApp.name.toLowerCase().indexOf(q.toLowerCase()) !== -1 ||
                        titles.toLowerCase().indexOf(q.toLowerCase()) !== -1 ||
                        descriptions.toLowerCase().indexOf(q.toLowerCase()) !== -1 ||
                        tags.toLowerCase().indexOf(q.toLowerCase()) !== -1;
                }
                if (updatedSince) {
                    return portalApp.lastReloadTs > updatedSince;
                }
                return true;
            })
            .map<MashroomKnownPortalApp | null>((portalApp) => {
                const permitted = admin || !Array.isArray(portalApp.defaultRestrictViewToRoles) || portalApp.defaultRestrictViewToRoles.length === 0
                    || portalApp.defaultRestrictViewToRoles.some((r) => mashroomSecurityUser?.roles.find((ur) => ur === r));

                if (!permitted) {
                    if (includeNotPermitted) {
                        return {
                            available: false,
                            name: portalApp.name,
                            version: portalApp.version,
                            title: portalApp.title ? i18nService.translate(req, portalApp.title) : null,
                            category: portalApp.category,
                            requiredRoles: portalApp.defaultRestrictViewToRoles ?? [],
                            lastReloadTs: portalApp.lastReloadTs,
                            unavailableReason: 'forbidden',
                        };
                    }
                    return null;
                }

                const encodedPortalAppName = encodeURIComponent(portalApp.name);
                const resourcesBasePath = `${getFrontendResourcesBasePath(req, cdnService?.getCDNHost())}${PORTAL_APP_RESOURCES_BASE_PATH}/${encodedPortalAppName}`;
                const screenshots = (portalApp.screenshots || []).map((path) => `${resourcesBasePath}/${path}`);
                return {
                    available: true,
                    name: portalApp.name,
                    version: portalApp.version,
                    title: portalApp.title ? i18nService.translate(req, portalApp.title) : null,
                    category: portalApp.category,
                    description: portalApp.description ? i18nService.translate(req, portalApp.description) : null,
                    tags: portalApp.tags,
                    homepage: portalApp.homepage || undefined,
                    screenshots,
                    requiredRoles: portalApp.defaultRestrictViewToRoles ?? [],
                    metaInfo: portalApp.metaInfo,
                    lastReloadTs: portalApp.lastReloadTs,
                };
            })
            .filter((app) => !!app);

        res.json(apps);
    }

    private _getPortalApp(pluginName: string) {
        return this._pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

    private async _getPortalAppInstance(page: MashroomPortalPage, portalApp: MashroomPortalApp, instanceId: string, req: Request) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal!.service;

        const instData = findPortalAppInstanceOnPage(page, portalApp.name, instanceId);

        if (!instData) {
            return null;
        }

        return portalService.getPortalAppInstance(portalApp.name, instanceId);
    }

    private async _getDynamicallyLoadedPortalAppInstance(portalApp: MashroomPortalApp, req: Request) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal!.service;

        // Maybe there was created an instance in the storage
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

    private async _sendResource(resourcePath: string, portalApp: MashroomPortalApp, req: Request, res: Response): Promise<boolean> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        if (cacheControlService) {
            // Cache any resource with query parameters (e.g. ?v=xxx) or a hash in the name
            if (Object.keys(req.query).length > 0 || fileTypeUtils.isChunkWithHash(resourcePath)) {
                cacheControlService.addCacheControlHeader('SHARED', req, res);
            } else {
                cacheControlService.addCacheControlHeader('NEVER', req, res);
            }
        }

        const resourceUri = `${portalApp.resourcesRootUri}/${resourcePath}`;

        // Security check: A proxy target could be a sub path of the resource base URL,
        // so, make sure this route is not misused to access an API endpoint
        const hasExtension = !!resourceUri.match(/\.\w{2,5}$/);
        if (!hasExtension && portalApp.proxies && Object.values(portalApp.proxies).some(({targetUri}) => resourceUri.startsWith(targetUri))) {
            logger.error('Attempted access to an API endpoint via resource request:', resourceUri);
            res.sendStatus(401);
            return false;
        }

        logger.debug(`Sending Portal App resource: ${resourceUri}`);

        try {
            await streamResource(resourceUri, res, logger);
            return true;
        } catch (err: any) {
            logger.error(`Cannot load Portal App resource: ${resourceUri}`, err);
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

        return false;
    }

}
