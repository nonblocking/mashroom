// @flow

import {findSiteByPath} from './model_utils';

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomPortalApp,
    MashroomPortalAppUserPermissions,
    MashroomPortalProxyDefinition,
    MashroomPortalRolePermissions,
} from '../../../type-definitions';

export const getUser = (req: ExpressRequest) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    return securityService.getUser(req);
};

export const isAdmin = (req: ExpressRequest) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    return securityService.isAdmin(req);
};

export const isSignedIn = (req: ExpressRequest) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    return securityService.isAuthenticated(req);
};

export const forceAuthentication = async (path: string, req: ExpressRequest, res: ExpressResponse, logger: MashroomLogger) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    const result = await securityService.authenticate(req, res);
    switch (result) {
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

export const isSitePathPermitted = async (req: ExpressRequest, sitePath: string): Promise<boolean> => {
    const site = await findSiteByPath(req, sitePath);
    if (!site) {
        return false;
    }
    return await isSitePermitted(req, site.siteId);
};

export const isSitePermitted = async (req: ExpressRequest, siteId: string): Promise<boolean> => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    const logger = req.pluginContext.loggerFactory('portal');

    logger.debug(`Checking permission for site ${siteId}`);
    return await securityService.checkResourcePermission(req, 'Site', siteId, 'View', true);
};

export const isPagePermitted = async (req: ExpressRequest, pageId: string): Promise<boolean> => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    const logger = req.pluginContext.loggerFactory('portal');

    logger.debug(`Checking permission for page ${pageId}`);
    return await securityService.checkResourcePermission(req, 'Page', pageId, 'View', true);
};

export const getPortalAppResourceKey = (pluginName: string, instanceId: ?string) => {
    return `${pluginName}_${instanceId || 'global'}`;
};

export const isAppPermitted = async (req: ExpressRequest, pluginName: string, portalAppInstanceId: ?string, existingPortalApp: ?MashroomPortalApp): Promise<boolean> => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    const logger = req.pluginContext.loggerFactory('portal');

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
        const permitted = defaultRestrictViewToRoles.some((r) => user && user.roles && user.roles.find((ur) => ur === r));
        if (!permitted) {
            logger.error(`Dynamic portal app access denied: User has none of the roles in the defaultRestrictViewToRoles list: ${defaultRestrictViewToRoles.join(', ')}`);
            return false;
        }
    }

    return true;
};

export const isProxyAccessPermitted = async (req: ExpressRequest, restProxyDef: MashroomPortalProxyDefinition, logger: MashroomLogger): Promise<boolean> => {
    const user = getUser(req);

    // Check restricted to roles
    const restrictToRoles = restProxyDef.restrictToRoles;
    if (restrictToRoles && Array.isArray(restrictToRoles) && restrictToRoles.length > 0) {
        const permitted = restrictToRoles.some((r) => user && user.roles && user.roles.find((ur) => ur === r));
        if (!permitted) {
            logger.error(`Proxy access denied: User has none of the roles in the restrictToRoles list: ${restrictToRoles.join(', ')}`);
            return false;
        }
    }

    return true;
};

export const calculatePermissions = (rolePermissions: ?MashroomPortalRolePermissions, user: ?MashroomSecurityUser): MashroomPortalAppUserPermissions => {
    const permissions: MashroomPortalAppUserPermissions = {};
    if (rolePermissions) {
        for (const permission in rolePermissions) {
            if (rolePermissions.hasOwnProperty(permission)) {
                const roles = rolePermissions[permission];
                if (roles && Array.isArray(roles) && roles.find((requiredRole) => user && user.roles && user.roles.find((role) => role === requiredRole))) {
                    permissions[permission] = true;
                }
            }
        }
    }
    return permissions;
};
