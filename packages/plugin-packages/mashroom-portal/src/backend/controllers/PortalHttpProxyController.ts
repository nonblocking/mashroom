
import {
    HTTP_HEADER_REST_PROXY_PERMISSIONS,
} from '../constants';
import context from '../context/global-portal-context';
import {calculatePermissions, getUser, isProxyAccessPermitted, isSitePathPermitted,} from '../utils/security-utils';
import {portalAppContext} from '../utils/logging-utils';
import {getSitePath} from '../utils/path-utils';

import type {Request, Response} from 'express';
import type {MashroomHttpProxyService} from '@mashroom/mashroom-http-proxy/type-definitions';
import type {MashroomPortalAppUserPermissions, MashroomPortalProxyDefinition,} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

export default class PortalHttpProxyController {

    constructor(private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async forward(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const {defaultProxyConfig} = context.portalPluginConfig;

        try {
            const httpProxyService: MashroomHttpProxyService = req.pluginContext.services.proxy!.service;
            const user = getUser(req);

            const sitePath = getSitePath(req);
            if (!await isSitePathPermitted(req, sitePath)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access site: ${sitePath}`);
                res.sendStatus(403);
                return;
            }

            const decodedPath = req.params['0'];
            const pathParts = decodedPath.split('/');
            if (pathParts.length < 2) {
                logger.warn(`Invalid rest proxy path: ${decodedPath}`);
                res.sendStatus(400);
                return;
            }

            const pluginName = pathParts[0];
            const restApiId = pathParts[1];
            const portalApp = this._pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
            if (!portalApp) {
                logger.warn('Portal App not found: ', pluginName);
                res.sendStatus(404);
                return;
            }

            logger.addContext(portalAppContext(portalApp));

            if (!portalApp.proxies) {
                logger.warn(`Invalid rest proxy path: ${decodedPath}`);
                res.sendStatus(400);
                return;
            }

            const restProxyDef: MashroomPortalProxyDefinition = portalApp.proxies[restApiId];

            if (!restProxyDef || !restProxyDef.targetUri) {
                logger.warn(`Invalid rest proxy path: ${decodedPath}`);
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
                fullTargetUri += `/${pathParts.splice(2).join('/')}`;
            }

            const headers: Record<string, string> = {};
            if (user) {
                if ((restProxyDef.sendPermissionsHeader || defaultProxyConfig.sendPermissionsHeader) && portalApp.rolePermissions) {
                    const permissions: MashroomPortalAppUserPermissions = calculatePermissions(portalApp.rolePermissions, user);
                    headers[HTTP_HEADER_REST_PROXY_PERMISSIONS] = Object.keys(permissions).filter((p) => permissions[p]).join(',');
                }
            }

            logger.info(`Forwarding Rest API call: ${req.method} /${decodedPath} --> ${fullTargetUri}`);
            await httpProxyService.forward(req, res, fullTargetUri, headers);

        } catch (e: any) {
            logger.error(e);
            if (!res.headersSent) {
                res.sendStatus(500);
            }
        }
    }

}
