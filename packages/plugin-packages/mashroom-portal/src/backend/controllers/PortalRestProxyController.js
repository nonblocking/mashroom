// @flow

import {parse} from 'url';
import {
    HTTP_HEADER_REST_PROXY_USER,
    HTTP_HEADER_REST_PROXY_ROLES,
    HTTP_HEADER_REST_PROXY_PERMISSIONS,
} from '../constants';
import {
    calculatePermissions,
    isSitePathPermitted,
    isProxyAccessPermitted,
    getUser,
} from '../utils/security_utils';
import {portalAppContext} from '../utils/logging_utils';
import {getSitePath} from '../utils/path_utils';

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomHttpProxyService} from '@mashroom/mashroom-http-proxy/type-definitions';
import type {
    MashroomPortalAppUserPermissions,
    MashroomPortalProxyDefinition,
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalRestProxyController {

    pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this.pluginRegistry = pluginRegistry;
    }

    async forward(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const httpProxyService: MashroomHttpProxyService = req.pluginContext.services.proxy.service;
            const user = getUser(req);

            const sitePath = getSitePath(req);
            if (!await isSitePathPermitted(req, sitePath)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access site: ${sitePath}`);
                res.sendStatus(403);
                return;
            }

            const parsedUrl = parse(req.params['0']);
            const path: string = decodeURI(parsedUrl.pathname || '');
            const pathParts = path.split('/');
            if (pathParts.length < 2) {
                logger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            const pluginName = pathParts[0];
            const restApiId = pathParts[1];
            const portalApp = this.pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
            if (!portalApp) {
                logger.warn('Portal app not found: ', pluginName);
                res.sendStatus(404);
                return;
            }

            logger.addContext(portalAppContext(portalApp));

            if (!portalApp.restProxies) {
                logger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            const restProxyDef: MashroomPortalProxyDefinition = portalApp.restProxies[restApiId];

            if (!restProxyDef || !restProxyDef.targetUri) {
                logger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            if (!await isProxyAccessPermitted(req, restProxyDef, logger)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access rest proxy: ${req.originalUrl}`);
                res.sendStatus(403);
                return;
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
                        headers[HTTP_HEADER_REST_PROXY_PERMISSIONS] = Object.keys(permissions).filter((p) => !!permissions[p]).join(',');
                    }
                }
                if (typeof (user.securityHttpHeaders) === 'object') {
                    headers = Object.assign({}, headers, user.securityHttpHeaders);
                }
            }

            if (typeof (restProxyDef.addHeaders) === 'object') {
                headers = Object.assign({}, headers, restProxyDef.addHeaders);
            }

            logger.info(`Forwarding Rest API call: ${req.method} /${path} --> ${fullTargetUri}`);
            await httpProxyService.forward(req, res, fullTargetUri, headers);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
