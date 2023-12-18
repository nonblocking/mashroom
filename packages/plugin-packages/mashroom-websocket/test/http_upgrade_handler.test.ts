
import {loggingUtils} from '@mashroom/mashroom-utils';
import httpUpgradeHandlerFn from '../src/backend/webapp/http_upgrade_handler';
import context from '../src/backend/context';

import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

describe('http_upgrade_handler', () => {

    context.basePath = '/websocket';
    context.restrictToRoles = ['Role1'];

    it('reject requests from unauthenticated users', (done) => {
        const upgradeHandler = httpUpgradeHandlerFn();

        const req: any = {
            url: '/websocket/demo2',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
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
                            getUser(): MashroomSecurityUser | null {
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
        const upgradeHandler = httpUpgradeHandlerFn();

        const req: any = {
            url: '/websocket/demo2',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
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
                            getUser(req: any): MashroomSecurityUser | null {
                                if (!req.session) {
                                    return null;
                                }
                                return {
                                    username: 'john',
                                    displayName: 'John',
                                    email: null,
                                    pictureUrl: null,
                                    roles: ['Role2', 'Role3'],
                                    secrets: null,
                                    extraData: null,
                                };
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
        const upgradeHandler = httpUpgradeHandlerFn();

        const req: any = {
            url: '/websocket/demo2',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
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
                            getUser(req: any): MashroomSecurityUser | null {
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
                                };
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
                    handleUpgrade(req: any, socket: any, head: any, cb: any) {
                        const ws = {};
                        cb(ws);
                    }
                };
            },
            createClient(webSocket: any, connectPath: any, user: any) {
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
