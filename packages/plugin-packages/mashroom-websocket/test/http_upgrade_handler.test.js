// @flow

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import httpUpgradeHandlerFn from '../src/backend/webapp/http_upgrade_handler';
import context from '../src/backend/context';

import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

describe('http_upgrade_handler', () => {

    context.basePath = '/websocket';
    context.restrictToRoles = ['Role1'];

    it('reject requests from unauthenticated users', (done) => {
        const upgradeHandler = httpUpgradeHandlerFn(dummyLoggerFactory);

        const req: any = {
            url: '/websocket/demo2',
            pluginContext: {
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
                            getUser(): ?MashroomSecurityUser {
                              return null;
                            }
                        }
                    }
                }
            }
        };
        const socket: any = {
            end(message: string) {
                expect(message).toBe('HTTP/1.1 403 Unauthenticated\r\n\r\n');
                done();
            }
        };
        const head: any = {};

        upgradeHandler(req, socket, head);
    });

    it('reject requests when the user has not required role', (done) => {
        const upgradeHandler = httpUpgradeHandlerFn(dummyLoggerFactory);

        const req: any = {
            url: '/websocket/demo2',
            pluginContext: {
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
                                    roles: ['Role2', 'Role3']
                                }
                            }
                        }
                    }
                }
            }
        };
        const socket: any = {
            end(message: string) {
                expect(message).toBe('HTTP/1.1 401 Forbidden\r\n\r\n');
                done();
            }
        };
        const head: any = {};

        upgradeHandler(req, socket, head);
    });

    it('handles the upgrade', (done) => {
        const upgradeHandler = httpUpgradeHandlerFn(dummyLoggerFactory);

        const req: any = {
            url: '/websocket/demo2',
            pluginContext: {
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
            }
        };
        const socket: any = {};
        const head: any = {};
        const server: any = {
            getServer() {
                return {
                    handleUpgrade(req, socket, head, cb) {
                        const ws = {};
                        cb(ws);
                    }
                }
            },
            createClient(webSocket, connectPath, user) {
                expect(webSocket).toBeTruthy();
                expect(connectPath).toBe('/demo2');
                expect(user.username).toBe('john');
                done();
            }
        };
        context.server = server;

        upgradeHandler(req, socket, head);
    });

});
