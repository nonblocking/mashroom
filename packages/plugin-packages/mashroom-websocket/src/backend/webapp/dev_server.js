// @flow
/* eslint no-console: off */

import http from 'http';
import express from 'express';
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import WebSocketServer from '../WebSocketServer';
import context from '../context';
import app from './webapp';
import httpUpgradeHandlerFn from './http_upgrade_handler';

import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

context.server = new WebSocketServer(loggerFactory);
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
                async apply(name, req) {
                   req.session = {};
                }
            }
        },
        security: {
            service: {
                getUser(req): ?MashroomSecurityUser {
                    if (!req.session) {
                        return null;
                    }
                    return {
                        username: 'john',
                        displayName: 'John',
                        roles: ['Role2', 'Role1']
                    }
                }
            }
        }
    }
};

context.server.addMessageListener((path) => path === '/test', (message, client) => {
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
    const reqWithContext = Object.assign({}, req, {
        pluginContext
    });
    upgradeHandler(reqWithContext, socket, head);
});

wrapperApp.use('/websocket', app);

httpServer.listen(8066, () => {
    console.log('Listening on 8066');
});

