
import {
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_APP_RESOURCES_SHARED_PATH,
    PORTAL_APP_REST_PROXY_BASE_PATH
} from '../constants';
import {getFrontendApiBasePath, getFrontendResourcesBasePath} from './path-utils';
import {calculatePermissions} from './security-utils';
import {createAppId} from './id-utils';
import {getVersionHash} from './cache-utils';
import {getConfigPluginWithRewriteImportMap} from './config-plugin-utils';

import type {Request} from 'express';
import type {MashroomPluginConfig} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomCDNService} from '@mashroom/mashroom-cdn/type-definitions';
import type {
    MashroomPortalAppSetup,
    MashroomPortalApp,
    MashroomPortalAppInstance,
    MashroomPortalAppUserPermissions,
    MashroomPortalAppUser,
    MashroomPortalProxyPaths,
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

const toPortalAppUser = async (mashroomSecurityUser: MashroomSecurityUser | undefined | null, req: Request, portalApp?: MashroomPortalApp, pluginRegistry?: MashroomPortalPluginRegistry): Promise<MashroomPortalAppUser> => {
    const permissions: MashroomPortalAppUserPermissions = portalApp && pluginRegistry ? await calculatePermissions(portalApp, pluginRegistry, mashroomSecurityUser, req) : {};

    return {
        guest: !mashroomSecurityUser,
        username: mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous',
        displayName: mashroomSecurityUser ? mashroomSecurityUser.displayName || mashroomSecurityUser.username : 'Anonymous',
        email: mashroomSecurityUser?.email ? mashroomSecurityUser.email : null,
        permissions
    };
};

const enhancePortalAppSetup = async (portalAppSetup: MashroomPortalAppSetup, portalApp: MashroomPortalApp,
                                     pluginRegistry: MashroomPortalPluginRegistry, req: Request): Promise<MashroomPortalAppSetup> => {
    const logger = req.pluginContext.loggerFactory('mashroom.portal');
    let enhancedAppSetup = portalAppSetup;

    const enhancements = pluginRegistry.portalAppEnhancements;
    for (let i = 0; i < enhancements.length; i++) {
        try {
            const plugin = enhancements[i].plugin;
            if (plugin) {
                enhancedAppSetup = await plugin.enhancePortalAppSetup(enhancedAppSetup, portalApp, req);
            }
        } catch (e) {
            logger.warn(`Calling Portal App enhancer ${enhancements[i].name} failed!`, e);
        }
    }

    return enhancedAppSetup;
};

export const createPortalAppSetup = async (portalApp: MashroomPortalApp,
                                           portalAppInstance: MashroomPortalAppInstance | undefined | null,
                                           overrideAppConfig: MashroomPluginConfig | undefined | null,
                                           mashroomSecurityUser: MashroomSecurityUser | undefined | null,
                                           pluginRegistry: MashroomPortalPluginRegistry,
                                           req: Request) => {
    const i18nService: MashroomI18NService = req.pluginContext.services.i18n!.service;
    const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;
    const devMode = req.pluginContext.serverInfo.devMode;

    const encodedPortalAppName = encodeURIComponent(portalApp.name);
    const resourcesBasePath = `${getFrontendResourcesBasePath(req, cdnService?.getCDNHost())}${PORTAL_APP_RESOURCES_BASE_PATH}/${encodedPortalAppName}`;
    const sharedResourcesBasePath = `${getFrontendResourcesBasePath(req, cdnService?.getCDNHost())}${PORTAL_APP_RESOURCES_BASE_PATH}${PORTAL_APP_RESOURCES_SHARED_PATH}`;

    let resources = portalApp.resources;
    if (resources.moduleSystem === 'SystemJS') {
        const configPluginWithRewriteImportMap = getConfigPluginWithRewriteImportMap(portalApp.name, pluginRegistry);
        if (configPluginWithRewriteImportMap) {
            const updatedImportMap = configPluginWithRewriteImportMap.plugin.rewriteImportMap!(portalApp, req);
            if (updatedImportMap) {
                const logger = req.pluginContext.loggerFactory('mashroom.portal');
                logger.debug(`Import map for Portal App '${portalApp.name} rewritten by config plugin: ${configPluginWithRewriteImportMap.name}:`, updatedImportMap);
                resources = {
                    ...resources,
                    importMap: updatedImportMap,
                };
            }
        }
    }

    const proxyBasePath = `${getFrontendApiBasePath(req)}${PORTAL_APP_REST_PROXY_BASE_PATH}/${encodedPortalAppName}`;
    const proxyPaths: MashroomPortalProxyPaths = {
        __baseUrl: proxyBasePath
    };
    if (portalApp.proxies && Object.keys(portalApp.proxies).length > 0) {
        for (const proxyId in portalApp.proxies) {
            if (proxyId && proxyId in portalApp.proxies) {
                proxyPaths[proxyId] = `${proxyBasePath}/${proxyId}`;
            }
        }
    }

    const lang = i18nService.getLanguage(req);
    const user = await toPortalAppUser(mashroomSecurityUser, req, portalApp, pluginRegistry);

    const appConfig = {...portalApp.defaultAppConfig, ...portalAppInstance?.appConfig ?? {}, ...overrideAppConfig ?? {}};

    const portalAppSetup: MashroomPortalAppSetup = {
        appId: portalAppInstance?.instanceId || createAppId(),
        pluginName: portalApp.name,
        title: portalApp.title ? i18nService.translate(req, portalApp.title) : null,
        version: portalApp.version,
        instanceId: portalAppInstance?.instanceId,
        lastReloadTs: portalApp.lastReloadTs,
        serverSideRendered: false,
        versionHash: getVersionHash(portalApp.version, portalApp.lastReloadTs, devMode),
        proxyPaths,
        restProxyPaths: proxyPaths,
        sharedResourcesBasePath,
        sharedResources: portalApp.sharedResources,
        resourcesBasePath,
        resources,
        clientBootstrapName: portalApp.clientBootstrap,
        lang,
        user,
        appConfig,
        editorConfig: portalApp.editorConfig,
    };

    return enhancePortalAppSetup(portalAppSetup, portalApp, pluginRegistry, req);
};

export const createPortalAppSetupForMissingPlugin = async (pluginName: string, instanceId: string | undefined, mashroomSecurityUser: MashroomSecurityUser | undefined | null, req: Request) => {
    const i18nService: MashroomI18NService = req.pluginContext.services.i18n!.service;

    const lang = i18nService.getLanguage(req);
    const user = await toPortalAppUser(mashroomSecurityUser, req);

    const portalAppSetup: MashroomPortalAppSetup = {
        appId: createAppId(),
        pluginName,
        pluginMissing: true,
        title: pluginName,
        version: '',
        instanceId,
        versionHash: '',
        lastReloadTs: Date.now(),
        serverSideRendered: false,
        proxyPaths: { __baseUrl: '' },
        restProxyPaths: { __baseUrl: '' },
        sharedResourcesBasePath: '',
        sharedResources: null,
        resourcesBasePath: '',
        resources: { moduleSystem: 'none', js: [] },
        clientBootstrapName: '',
        lang,
        user,
        appConfig: {},
        editorConfig: null,
    };

    return portalAppSetup;
};

