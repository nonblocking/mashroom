// @flow

import url from 'url';
import {HTTP_HEADER_REST_PROXY_USER, HTTP_HEADER_REST_PROXY_ROLES, HTTP_HEADER_REST_PROXY_PERMISSIONS} from '../constants';
import {calculatePermissions, isAdmin} from '../utils/security_utils';
import {userAndAgentContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import {portalAppContext} from '../utils/logging_utils';

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomHttpProxyService} from '@mashroom/mashroom-http-proxy/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomPortalAppUserPermissions,
    MashroomPortalPluginRegistry,
    MashroomPortalProxyDefinition
} from '../../../type-definitions';

export default class PortalRestProxyController {

    pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this.pluginRegistry = pluginRegistry;
    }

    async forward(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');
        let contextLogger = logger.withContext(userAndAgentContext(req));

        try {
            const httpProxyService: MashroomHttpProxyService = req.pluginContext.services.proxy.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
            const user = securityService.getUser(req);

            const parsedUrl = url.parse(req.params['0']);
            const path: string = decodeURI(parsedUrl.pathname || '');

            const pathParts = path.split('/');
            if (pathParts.length < 2) {
                contextLogger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            const pluginName = pathParts[0];
            const restApiId = pathParts[1];
            const portalApp = this.pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
            if (!portalApp) {
                contextLogger.warn('Portal app not found: ', portalApp);
                res.sendStatus(404);
                return;
            }

            contextLogger = contextLogger.withContext(portalAppContext(portalApp));

            if (!portalApp.restProxies) {
                contextLogger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            const restProxyDef: MashroomPortalProxyDefinition = portalApp.restProxies[restApiId];

            if (!restProxyDef || !restProxyDef.targetUri) {
                contextLogger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            if (!isAdmin(req) && portalApp.defaultRestrictedToRoles && Array.isArray(portalApp.defaultRestrictedToRoles)) {
                const permitted = portalApp.defaultRestrictedToRoles.some((r) => user && user.roles && user.roles.find((ur) => ur === r));
                if (!permitted) {
                    contextLogger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access portal app: ${portalApp.name}`);
                    res.sendStatus(403);
                    return;
                }
            }

            let fullTargetUri = restProxyDef.targetUri;
            if (pathParts.length > 2) {
                fullTargetUri += '/' + pathParts.splice(2).join('/');
            }
            if (parsedUrl.search) {
                fullTargetUri += parsedUrl.search;
            }

            let headers = {};
            if (user) {
                if (restProxyDef.sendUserHeader || restProxyDef.sendPermissionsHeader || restProxyDef.sendRolesHeader) {
                    if (restProxyDef.sendUserHeader) {
                        headers[HTTP_HEADER_REST_PROXY_USER] = user.username;
                    }
                    if (restProxyDef.sendRolesHeader) {
                        headers[HTTP_HEADER_REST_PROXY_ROLES] = user.roles.join(',');
                    }
                    if (restProxyDef.sendPermissionsHeader && portalApp.rolePermissions) {
                        const permissions: MashroomPortalAppUserPermissions = calculatePermissions(portalApp.rolePermissions, user);
                        const permissionsList = Object.keys(permissions).filter((p) => !!permissions[p]).join(',');
                        headers[HTTP_HEADER_REST_PROXY_PERMISSIONS] = permissionsList;
                    }
                }
                if (typeof (user.extraHttpHeaders) === 'object') {
                    headers = Object.assign({}, headers, user.extraHttpHeaders);
                }
            }

            if (typeof (restProxyDef.addHeaders) === 'object') {
                headers = Object.assign({}, headers, restProxyDef.addHeaders);
            }

            contextLogger.info(`Forwarding Rest API call: ${req.method} /${path} --> ${fullTargetUri}`);
            await httpProxyService.forward(req, res, fullTargetUri, headers);

        } catch (e) {
            contextLogger.error(e);
            res.sendStatus(500);
        }
    }

}