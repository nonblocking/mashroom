
import os from 'os';
import http from 'http';
import express from 'express';
import WebSocketServer from '../WebSocketServer';
import context from '../context';
import app from './webapp';
import httpUpgradeHandlerFn from './http_upgrade_handler';
import ReconnectMessageBufferStore from './ReconnectMessageBufferStore';
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';

import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

const tmpFileStore = new ReconnectMessageBufferStore(os.tmpdir(), '.', loggerFactory);
context.server = new WebSocketServer(loggerFactory, tmpFileStore);
context.restrictToRoles = ['Role1'];
context.basePath = '/websocket';

const wrapperApp = express();
const httpServer = http.createServer(wrapperApp);

// Dummy context
const pluginContext: any = {
    loggerFactory,
    services: {
        core: {
            middlewareStackService: {
                has: () => true,
                async apply(name: string, req: any) {
                    req.session = {};
                }
            }
        },
        security: {
            service: {
                getUser(req: any): MashroomSecurityUser | undefined | null {
                    if (!req.session) {
                        return null;
                    }
                    return {
                        username: 'john',
                        displayName: 'John',
                        email: null,
                        pictureUrl: null,
                        roles: ['Role2', 'Role1'],
                        secrets: null,
                        extraData: null,
                    }
                }
            }
        }
    }
};

setInterval(() => {
    context.server.clients.forEach(client => {
        context.server.sendMessage(client, {
            ping: new Date().toISOString(),
        });
    })
}, 3000);


context.server.addMessageListener((path) => path.startsWith('/test'), (message, client) => {
    console.info(`Received test message from user ${client.user.username}:`, message);
    context.server.addDisconnectListener((disconnectedClient) => {
        if (disconnectedClient === client) {
            console.info(`Test user ${client.user.username} is gone`);
        }
    });
    console.info('Currently connected test users:', context.server.getClientsOnPath('/test').length);
    setTimeout(async () => {
        await context.server.sendMessage(client, {
            greetings: `Hello ${client.user.displayName || client.user.username}!`
        });
    }, 500);
});

const upgradeHandler = httpUpgradeHandlerFn();
httpServer.on('upgrade', (req, socket, head) => {
    const reqWithContext = {...req, pluginContext};
    upgradeHandler(reqWithContext, socket, head);
});

wrapperApp.use('/websocket', app);

httpServer.listen(8066, () => {
    console.log('Listening on 8066');
});
httpServer.once('error', (error) => {
    console.error('Failed to start server!', error);
});

