
import {ServerResponse} from 'http';
import {userContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import context from '../context';

import type {Socket} from 'net';
import type {Request} from 'express';
import type {
    IncomingMessageWithContext,
    MashroomHttpUpgradeHandler,
    MashroomLogger,
    MashroomMiddlewareStackService
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

export default (): MashroomHttpUpgradeHandler => {
    return (message, socket, head) => {
        handle(message, socket, head);
    };
};

const handle = async (message: IncomingMessageWithContext, socket: Socket, head: Buffer) => {
    const logger: MashroomLogger = message.pluginContext.loggerFactory('mashroom.websocket.service');

    logger.debug('Upgrade request received: ', message.url);
    let user: MashroomSecurityUser | undefined | null = null;
    try {
        user = await getUser(message, logger);
    } catch (error) {
        logger.error('User determination failed', error);
    }
    if (!user) {
        logger.error('Anonymous users cannot use mashroom-websocket');
        sendError(socket, 403, 'Unauthenticated');
        return;
    }

    if (context.restrictToRoles && context.restrictToRoles.length > 0 && !context.restrictToRoles.some((role) => user && user.roles.indexOf(role) !== -1)) {
        logger.error(`User ${user.username} has not required roles to use mashroom-websocket`);
        sendError(socket, 401, 'Forbidden');
        return;
    }

    if (!message.url) {
        sendError(socket, 400, 'Bad Request');
        return;
    }

    const connectPath = message.url.substr(context.basePath.length);

    context.server.getServer().handleUpgrade(message, socket, head, (ws) => {
        if (user) {
            const loggerContext = {...logger.getContext(), ...userContext(user)};
            context.server.createClient(ws, connectPath, user, loggerContext);
        }
    });
};

const getUser = async (message: IncomingMessageWithContext, logger: MashroomLogger): Promise<MashroomSecurityUser | null | undefined> => {
    const req = message as Request;

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

const sendError = (socket: Socket, statusCode: number, message: string) => {
    socket.end(`HTTP/1.1 ${statusCode} ${message}\r\n\r\n`, 'ascii');
};
