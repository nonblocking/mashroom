
import context from '../context/global_portal_context';
import {findSiteByPath} from './model_utils';

import type {Request, Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomPortalApp,
    MashroomPortalAppUserPermissions,
    MashroomPortalProxyDefinition,
    MashroomPortalRolePermissions,
} from '../../../type-definitions';
import type {Writable} from '../../../type-definitions/internal';

export const getUser = (req: Request): MashroomSecurityUser | null | undefined => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
    return securityService.getUser(req);
};

export const isAdmin = (req: Request): boolean => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
    return securityService.isAdmin(req);
};

export const isSignedIn = (req: Request): boolean => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
    return securityService.isAuthenticated(req);
};

export const forceAuthentication = async (path: string, req: Request, res: Response, logger: MashroomLogger): Promise<void> => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
    const result = await securityService.authenticate(req, res);
    switch (result.status) {
        case 'authenticated': {
            // Refresh
            res.redirect(req.originalUrl);
            break;
        }
        case 'deferred': {
            // Nothing to do
            break;
        }
        default: {
            logger.error(`User anonymous is not allowed to access path: ${path}`);
            res.sendStatus(403);
        }
    }
};

export const isSitePathPermitted = async (req: Request, sitePath: string): Promise<boolean> => {
    const site = await findSiteByPath(req, sitePath);
    if (!site) {
        return false;
    }
    return await isSitePermitted(req, site.siteId);
};

export const isSitePermitted = async (req: Request, siteId: string): Promise<boolean> => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
    const logger = req.pluginContext.loggerFactory('mashroom.portal');

    logger.debug(`Checking permission for site ${siteId}`);
    return await securityService.checkResourcePermission(req, 'Site', siteId, 'View', true);
};

export const isPagePermitted = async (req: Request, pageId: string): Promise<boolean> => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
    const logger = req.pluginContext.loggerFactory('mashroom.portal');

    logger.debug(`Checking permission for page ${pageId}`);
    return await securityService.checkResourcePermission(req, 'Page', pageId, 'View', true);
};

export const getPortalAppResourceKey = (pluginName: string, instanceId: string | undefined | null) => {
    return `${pluginName}_${instanceId || 'global'}`;
};

export const isAppPermitted = async (req: Request, pluginName: string, portalAppInstanceId: string | undefined | null,
                                     existingPortalApp: MashroomPortalApp | undefined | null): Promise<boolean> => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
    const logger = req.pluginContext.loggerFactory('mashroom.portal');

    logger.debug(`Checking permission for app ${pluginName} and instance: ${pluginName || 'global'}`);
    if (portalAppInstanceId) {
        return await securityService.checkResourcePermission(req, 'Portal-App', getPortalAppResourceKey(pluginName, portalAppInstanceId), 'View', true);
    }

    // Dynamically loaded app without an instanceId
    if (!existingPortalApp) {
        return false;
    }

    if (isAdmin(req)) {
        return true;
    }
    const user = securityService.getUser(req);
    const defaultRestrictViewToRoles = existingPortalApp.defaultRestrictViewToRoles;
    if (defaultRestrictViewToRoles && Array.isArray(defaultRestrictViewToRoles) && defaultRestrictViewToRoles.length > 0) {
        const permitted = defaultRestrictViewToRoles.some((r) => user?.roles?.find((ur) => ur === r));
        if (!permitted) {
            logger.error(`Dynamic portal app access denied: User has none of the roles in the defaultRestrictViewToRoles list: ${defaultRestrictViewToRoles.join(', ')}`);
            return false;
        }
    }

    return true;
};

export const isProxyAccessPermitted = async (req: Request, restProxyDef: MashroomPortalProxyDefinition, logger: MashroomLogger): Promise<boolean> => {
    const user = getUser(req);
    const {defaultProxyConfig} = context.portalPluginConfig;

    // Check restricted to roles
    const restrictToRoles = [];
    if (Array.isArray(defaultProxyConfig?.restrictToRoles)) {
        restrictToRoles.push(...defaultProxyConfig.restrictToRoles);
    }
    if (Array.isArray(restProxyDef.restrictToRoles)) {
        restrictToRoles.push(...restProxyDef.restrictToRoles);
    }
    if (restrictToRoles.length > 0) {
        const permitted = restrictToRoles.some((r) => user?.roles?.find((ur) => ur === r));
        if (!permitted) {
            logger.error(`Proxy access denied: User has none of the roles in the restrictToRoles list: ${restrictToRoles.join(', ')}`);
            return false;
        }
    }

    return true;
};

export const calculatePermissions = (rolePermissions: MashroomPortalRolePermissions | undefined | null, user: MashroomSecurityUser | undefined | null): MashroomPortalAppUserPermissions => {
    const permissions: Writable<MashroomPortalAppUserPermissions> = {};
    if (rolePermissions) {
        for (const permission in rolePermissions) {
            if (rolePermissions.hasOwnProperty(permission)) {
                const roles = rolePermissions[permission];
                if (roles && Array.isArray(roles) && roles.find((requiredRole) => user?.roles?.find((role) => role === requiredRole))) {
                    permissions[permission] = true;
                }
            }
        }
    }
    return permissions;
};
