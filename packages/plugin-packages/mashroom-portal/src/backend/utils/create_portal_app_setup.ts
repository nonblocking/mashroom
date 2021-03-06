
import {getFrontendApiResourcesBasePath} from './path_utils';
import {
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_APP_RESOURCES_SHARED_PATH,
    PORTAL_APP_REST_PROXY_BASE_PATH
} from '../constants';
import {calculatePermissions} from './security_utils';

import type {Request} from 'express';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomPortalAppSetup,
    MashroomPortalApp,
    MashroomPortalAppInstance,
    MashroomPortalAppUserPermissions,
    MashroomPortalAppUser,
    MashroomRestProxyPaths
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

const toPortalAppUser = (mashroomSecurityUser: MashroomSecurityUser | undefined | null, portalApp: MashroomPortalApp): MashroomPortalAppUser => {
    const permissions: MashroomPortalAppUserPermissions = calculatePermissions(portalApp.rolePermissions, mashroomSecurityUser);

    return {
        guest: !mashroomSecurityUser,
        username: mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous',
        displayName: mashroomSecurityUser ? mashroomSecurityUser.displayName || mashroomSecurityUser.username : 'Anonymous',
        email: mashroomSecurityUser?.email ? mashroomSecurityUser.email : null,
        permissions
    };
}

const enhancePortalAppSetup = async (portalAppSetup: MashroomPortalAppSetup, portalApp: MashroomPortalApp,
                                     pluginRegistry: MashroomPortalPluginRegistry, req: Request): Promise<MashroomPortalAppSetup> => {
    const logger = req.pluginContext.loggerFactory('mashroom.portal');
    let enhancedAppSetup = portalAppSetup;

    const enhancements = pluginRegistry.portalAppEnhancements;
    for (let i = 0; i < enhancements.length; i++) {
        try {
            enhancedAppSetup = await enhancements[i].plugin.enhancePortalAppSetup(enhancedAppSetup, portalApp, req);
        } catch (e) {
            logger.warn(`Calling Portal App enhancer ${enhancements[i].name} failed!`, e);
        }
    }

    return enhancedAppSetup;
}

export default async (portalApp: MashroomPortalApp, portalAppInstance: MashroomPortalAppInstance, mashroomSecurityUser: MashroomSecurityUser | undefined | null,
                      pluginRegistry: MashroomPortalPluginRegistry, req: Request) => {
    const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

    const encodedPortalAppName = encodeURIComponent(portalApp.name);
    const resourcesBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_APP_RESOURCES_BASE_PATH}/${encodedPortalAppName}`;
    const sharedResourcesBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_APP_RESOURCES_BASE_PATH}${PORTAL_APP_RESOURCES_SHARED_PATH}`;
    const restProxyBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_APP_REST_PROXY_BASE_PATH}/${encodedPortalAppName}`;
    const restProxyPaths: MashroomRestProxyPaths = {
        __baseUrl: restProxyBasePath
    };
    if (portalApp.restProxies && Object.keys(portalApp.restProxies).length > 0) {
        for (const proxyId in portalApp.restProxies) {
            if (proxyId && portalApp.restProxies.hasOwnProperty(proxyId)) {
                restProxyPaths[proxyId] = `${restProxyBasePath}/${proxyId}`;
            }
        }
    }

    const lang = await i18nService.getLanguage(req);
    const user = toPortalAppUser(mashroomSecurityUser, portalApp);

    const appConfig = {...portalApp.defaultAppConfig, ...portalAppInstance.appConfig};

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

    return enhancePortalAppSetup(portalAppSetup, portalApp, pluginRegistry, req);
}
