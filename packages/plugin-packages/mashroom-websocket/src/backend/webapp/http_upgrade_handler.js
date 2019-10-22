// @flow

import {ServerResponse} from 'http';
import {userContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import context from '../context';

import type {
    HttpServerRequest,
    MashroomLogger,
    MashroomHttpUpgradeHandler,
    MashroomMiddlewareStackService
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

export default (): MashroomHttpUpgradeHandler => {
    return (req, socket, head) => {
        handle(req, socket, head);
    };
}

const handle = async (req: HttpServerRequest, socket: net$Socket, head: Buffer) => {
    const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.websocket.service');

    logger.debug('Upgrade request received: ', req.url);
    let user: ?MashroomSecurityUser = null;
    try {
        user = await getUser(req, logger);
    } catch (error) {
        logger.error('User determination failed', error);
    }
    if (!user) {
        logger.error('Unauthenticated user cannot upgrade to WebSocket');
        sendError(socket, 403, 'Unauthenticated');
        return;
    }

    if (context.restrictToRoles && context.restrictToRoles.length > 0 && !context.restrictToRoles.some((role) => user && user.roles.indexOf(role) !== -1)) {
        logger.error(`User ${user.username} has not required roles to upgrade to WebSocket`);
        sendError(socket, 401, 'Forbidden');
        return;
    }

    const connectPath = req.url.substr(context.basePath.length);

    context.server.getServer().handleUpgrade(req, socket, head, (ws) => {
        if (user) {
            const loggerContext = Object.assign({}, logger.getContext(), userContext(user));
            context.server.createClient(ws, connectPath, user, loggerContext);
        }
    });
};

const getUser = async (req: HttpServerRequest, logger: MashroomLogger): Promise<?MashroomSecurityUser> => {
    // Execute session middleware
    const middlewareStackService: MashroomMiddlewareStackService = req.pluginContext.services.core.middlewareStackService;
    if (!middlewareStackService.has('Mashroom Session Middleware')) {
        logger.error('No session middleware found!');
        return null;
    }
    const dummyResponse: any = new ServerResponse(req);
    await middlewareStackService.apply('Mashroom Session Middleware', req, dummyResponse);

    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
    return securityService.getUser(req);
};

const sendError = (socket: net$Socket, statusCode: number, message: string) => {
    socket.end(`HTTP/1.1 ${statusCode} ${message}\r\n\r\n`,'ascii');
};
