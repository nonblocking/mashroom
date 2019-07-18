// @flow

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomPortalAppUserPermissions, MashroomPortalRolePermissions} from '../../../type-definitions';

export const isAdmin = (req: ExpressRequest) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    return securityService.isAdmin(req);
};

export const isSignedIn = (req: ExpressRequest) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    return securityService.isAuthenticated(req);
};

export const authenticate = async (req: ExpressRequest, res: ExpressResponse) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    await securityService.authenticate(req, res);
};

export const isSitePermitted = async (req: ExpressRequest, siteId: string) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    const logger = req.pluginContext.loggerFactory('portal');

    logger.debug(`Checking permission for site ${siteId}`);
    return await securityService.checkResourcePermission(req, 'Site', siteId, 'View', true);
};

export const isPagePermitted = async (req: ExpressRequest, pageId: string) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    const logger = req.pluginContext.loggerFactory('portal');

    logger.debug(`Checking permission for page ${pageId}`);
    return await securityService.checkResourcePermission(req, 'Page', pageId, 'View', true);
};

export const getPortalAppResourceKey = (pluginName: string, instanceId: ?string) => {
    return `${pluginName}_${instanceId || 'global'}`;
};

export const isAppPermitted = async (req: ExpressRequest, pluginName: string, instanceId: ?string) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    const logger = req.pluginContext.loggerFactory('portal');

    logger.debug(`Checking permission for app ${pluginName} and instance: ${instanceId || 'global'}`);
    return await securityService.checkResourcePermission(req, 'Portal-App', getPortalAppResourceKey(pluginName, instanceId), 'View', true);
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
