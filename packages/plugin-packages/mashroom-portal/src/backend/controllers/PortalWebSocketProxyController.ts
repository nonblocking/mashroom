
import {STATUS_CODES} from 'http';
import {
    HTTP_HEADER_REST_PROXY_PERMISSIONS,
    PORTAL_APP_REST_PROXY_BASE_PATH,
    PORTAL_INTERNAL_PATH,
} from '../constants';
import context from '../context/global_portal_context';
import {calculatePermissions, getUser, isProxyAccessPermitted, isSitePathPermitted,} from '../utils/security_utils';
import {portalAppContext} from '../utils/logging_utils';

import type {Socket} from 'net';
import type {Request} from 'express';
import type {IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';
import type {MashroomHttpProxyService} from '@mashroom/mashroom-http-proxy/type-definitions';
import type {MashroomPortalAppUserPermissions, MashroomPortalProxyDefinition,} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';
import {MashroomMiddlewareStackService} from '@mashroom/mashroom/type-definitions';

export default class PortalRestProxyController {

    constructor(private basePath: string, private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async forward(message: IncomingMessageWithContext, socket: Socket, head: Buffer): Promise<void> {
        const req = message as Request;
        const logger = message.pluginContext.loggerFactory('mashroom.portal');
        const httpProxyService: MashroomHttpProxyService = req.pluginContext.services.proxy.service;
        const {defaultProxyConfig} = context.portalPluginConfig;

        const sendStatus = (status: number) => {
            const message = STATUS_CODES[status];
            socket.end(`HTTP/1.1 ${status} ${message}\r\n\r\n`, 'ascii');
        };

        try {
            // If present we need to apply the session middleware for this upgrade req, otherwise we might have no security context;
            // and also the vhost path mapping middleware, if present, which fixes the url
            const middlewareStackService: MashroomMiddlewareStackService = req.pluginContext.services.core.middlewareStackService;
            const dummyResponse: any = {};
            if (middlewareStackService.has('Mashroom Session Middleware')) {
                await middlewareStackService.apply('Mashroom Session Middleware', req, dummyResponse);
            }
            if (middlewareStackService.has('Mashroom VHost Path Mapper Middleware')) {
                await middlewareStackService.apply('Mashroom VHost Path Mapper Middleware', req, dummyResponse);
            }

            // The url has the format /<basePath>/<sitePath>/___/proxy/<encodedAppName>/<proxyName>/path?q=1
            const url = message.url;
            if (!url) {
                logger.warn(`Invalid proxy path: ${url}`);
                sendStatus(400);
                return;
            }
            const path = url.substr(this.basePath.length + 1);
            logger.debug('Request for WebSocket proxy on:', path);

            const [sitePathName, internalPrefix, proxyPrefix, encodedPluginName, proxyName, ...targetPathParts] = path.split('/');
            if (internalPrefix !== PORTAL_INTERNAL_PATH.substr(1) || proxyPrefix !== PORTAL_APP_REST_PROXY_BASE_PATH.substr(1)) {
                logger.warn(`Invalid proxy path: ${path}`);
                sendStatus(400);
                return;
            }

            const user = getUser(req);

            const sitePath = `/${sitePathName}`;
            if (!await isSitePathPermitted(req, sitePath)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access site: ${sitePath}`);
                sendStatus(403);
                return;
            }

            const pluginName = decodeURIComponent(encodedPluginName);
            const portalApp = this._pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
            if (!portalApp) {
                logger.warn('Portal app not found: ', pluginName);
                sendStatus(404);
                return;
            }

            logger.addContext(portalAppContext(portalApp));

            if (!portalApp.proxies) {
                logger.warn(`Invalid proxy path: ${url}`);
                sendStatus(400);
                return;
            }

            const restProxyDef: MashroomPortalProxyDefinition = portalApp.proxies[proxyName];

            if (!restProxyDef || !restProxyDef.targetUri) {
                logger.warn(`Invalid proxy path: ${url}`);
                sendStatus(400);
                return;
            }

            if (!await isProxyAccessPermitted(req, restProxyDef, logger)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access rest proxy: ${req.originalUrl}`);
                sendStatus(403);
                return;
            }

            let fullTargetUri = restProxyDef.targetUri;
            if (targetPathParts.length > 0) {
                fullTargetUri += `/${targetPathParts.join('/')}`;
            }

            const headers: Record<string, string> = {};
            if (user) {
                if ((restProxyDef.sendPermissionsHeader || defaultProxyConfig.sendPermissionsHeader) && portalApp.rolePermissions) {
                    const permissions: MashroomPortalAppUserPermissions = calculatePermissions(portalApp.rolePermissions, user);
                    headers[HTTP_HEADER_REST_PROXY_PERMISSIONS] = Object.keys(permissions).filter((p) => permissions[p]).join(',');
                }
            }

            logger.info(`Forwarding WebSocket API call: ${message.url} --> ${fullTargetUri}`);
            return httpProxyService.forwardWs(message, socket, head, fullTargetUri, headers);

        } catch (e: any) {
            logger.error(e);
            sendStatus(500);
        }
    }
}
