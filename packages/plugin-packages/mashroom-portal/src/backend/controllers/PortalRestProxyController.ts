
import {parse} from 'url';
import {
    HTTP_HEADER_REST_PROXY_PERMISSIONS,
    HTTP_HEADER_REST_PROXY_USER,
    HTTP_HEADER_REST_PROXY_USER_DISPLAY_NAME,
    HTTP_HEADER_REST_PROXY_USER_EMAIL,
} from '../constants';
import {calculatePermissions, getUser, isProxyAccessPermitted, isSitePathPermitted,} from '../utils/security_utils';
import {portalAppContext} from '../utils/logging_utils';
import {getSitePath} from '../utils/path_utils';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomHttpProxyService} from '@mashroom/mashroom-http-proxy/type-definitions';
import type {MashroomPortalAppUserPermissions, MashroomPortalProxyDefinition,} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalRestProxyController {

    constructor(private pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async forward(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const httpProxyService: MashroomHttpProxyService = reqWithContext.pluginContext.services.proxy.service;
            const user = getUser(reqWithContext);

            const sitePath = getSitePath(reqWithContext);
            if (!await isSitePathPermitted(reqWithContext, sitePath)) {
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

            if (!await isProxyAccessPermitted(reqWithContext, restProxyDef, logger)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access rest proxy: ${req.originalUrl}`);
                res.sendStatus(403);
                return;
            }

            let fullTargetUri = restProxyDef.targetUri;
            if (pathParts.length > 2) {
                fullTargetUri += `/${pathParts.splice(2).join('/')}`;
            }
            if (parsedUrl.search) {
                fullTargetUri += parsedUrl.search;
            }

            let headers: Record<string, string> = {};
            if (user) {
                // @ts-ignore
                if (restProxyDef.sendUserHeaders || restProxyDef.sendUserHeader) {
                    headers[HTTP_HEADER_REST_PROXY_USER] = user.username;
                    if (user.displayName) {
                        headers[HTTP_HEADER_REST_PROXY_USER_DISPLAY_NAME] = user.displayName;
                    }
                    if (user.email) {
                        headers[HTTP_HEADER_REST_PROXY_USER_EMAIL] = user.email;
                    }
                }
                if (restProxyDef.sendPermissionsHeader && portalApp.rolePermissions) {
                    const permissions: MashroomPortalAppUserPermissions = calculatePermissions(portalApp.rolePermissions, user);
                    headers[HTTP_HEADER_REST_PROXY_PERMISSIONS] = Object.keys(permissions).filter((p) => !!permissions[p]).join(',');
                }
            }

            if (typeof (restProxyDef.addHeaders) === 'object') {
                headers = {...headers, ...restProxyDef.addHeaders};
            }

            logger.info(`Forwarding Rest API call: ${req.method} /${path} --> ${fullTargetUri}`);
            await httpProxyService.forward(reqWithContext, res, fullTargetUri, headers);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

}
