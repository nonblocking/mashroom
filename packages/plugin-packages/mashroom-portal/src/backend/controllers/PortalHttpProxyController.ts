
import {
    HTTP_HEADER_REST_PROXY_PERMISSIONS,
} from '../constants';
import context from '../context/global-portal-context';
import {calculatePermissions, getUser, isProxyAccessPermitted, isSitePathPermitted,} from '../utils/security-utils';
import {portalAppContext} from '../utils/logging-utils';
import {getSitePath} from '../utils/path-utils';
import {getConfigPluginWithAddProxyRequestHeaders, getConfigPluginWithOverwriteProxyTargetUrl} from '../utils/config-plugin-utils';

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

            const pathParts = req.params.path as unknown as Array<string>;
            const path = pathParts.join('/');

            if (pathParts.length < 2) {
                logger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            const portalAppName = pathParts[0];
            const proxyId = pathParts[1];
            const portalApp = this._pluginRegistry.portalApps.find((pa) => pa.name === portalAppName);
            if (!portalApp) {
                logger.warn('Portal App not found: ', portalAppName);
                res.sendStatus(404);
                return;
            }

            logger.addContext(portalAppContext(portalApp));

            if (!portalApp.proxies) {
                logger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            const proxyDef: MashroomPortalProxyDefinition = portalApp.proxies[proxyId];

            if (!proxyDef || !proxyDef.targetUri) {
                logger.warn(`Invalid rest proxy path: ${path}`);
                res.sendStatus(400);
                return;
            }

            if (!await isProxyAccessPermitted(req, proxyDef, logger)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access rest proxy: ${req.originalUrl}`);
                res.sendStatus(403);
                return;
            }

            let fullTargetUri = proxyDef.targetUri;

            const appConfigPluginWithOverwriteProxyTargetUrl = getConfigPluginWithOverwriteProxyTargetUrl(portalAppName, this._pluginRegistry);
            if (appConfigPluginWithOverwriteProxyTargetUrl) {
                const overwriteTargetUri = appConfigPluginWithOverwriteProxyTargetUrl.plugin.overwriteProxyTargetUrl!(portalApp, proxyId, req);
                if (overwriteTargetUri) {
                    logger.debug(`targetUri for proxy ${proxyId} of Portal App ${portalApp.name} rewritten by config plugin: ${appConfigPluginWithOverwriteProxyTargetUrl.name}:`, overwriteTargetUri);
                    fullTargetUri = overwriteTargetUri;
                }
            }

            if (pathParts.length > 2) {
                fullTargetUri += `/${pathParts.splice(2).join('/')}`;
            }

            const headers: Record<string, string> = {};

            const appConfigPluginWithAddProxyRequestHeaders = getConfigPluginWithAddProxyRequestHeaders(portalAppName, this._pluginRegistry);
            if (appConfigPluginWithAddProxyRequestHeaders) {
                const additionalHeaders = appConfigPluginWithAddProxyRequestHeaders.plugin.addProxyRequestHeaders!(portalApp, proxyId, req);
                if (additionalHeaders) {
                    logger.debug(`Additional headers to proxy request to ${fullTargetUri} for Portal App ${portalApp.name} added by config plugin ${appConfigPluginWithAddProxyRequestHeaders.name}:`, additionalHeaders);
                    Object.assign(headers, additionalHeaders);
                }
            }

            if (user) {
                if ((proxyDef.sendPermissionsHeader || defaultProxyConfig.sendPermissionsHeader) && portalApp.rolePermissions) {
                    const permissions: MashroomPortalAppUserPermissions = await calculatePermissions(portalApp, this._pluginRegistry, user, req);
                    headers[HTTP_HEADER_REST_PROXY_PERMISSIONS] = Object.keys(permissions).filter((p) => permissions[p]).join(',');
                }
            }

            logger.info(`Forwarding Rest API call: ${req.method} /${path} --> ${fullTargetUri}`);
            await httpProxyService.forward(req, res, fullTargetUri, headers);

        } catch (e: any) {
            logger.error(e);
            if (!res.headersSent) {
                res.sendStatus(500);
            }
        }
    }

}
