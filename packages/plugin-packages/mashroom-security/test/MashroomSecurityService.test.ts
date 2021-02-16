
// @ts-ignore
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomSecurityService from '../src/services/MashroomSecurityService';

describe('MashroomSecurityService', () => {

    it('returns the user from the provider', () => {
        const req: any = {
            pluginContext: {
                loggerFactory
            }
        };
        const aclChecker: any = {};
        const securityProviderRegistry: any = {
            findProvider() {
                return {
                    getUser() {
                        return {
                            roles: ['Role2']
                        };
                    }
                }
            }
        };

        const securityService = new MashroomSecurityService('testProvider', null, securityProviderRegistry, aclChecker);

        const user = securityService.getUser(req);

        expect(user).toBeTruthy();
        if (user) {
            expect(user.roles).toEqual(['Role2', 'Authenticated']);
        }
    });

    it('creates a new session if an authentication is requested', async () => {
        let sessionRegenerated = false;

        const req: any = {
            pluginContext: {
                loggerFactory
            },
            url: 'http://localhost?hint1=foo&foo=bar&xxx=1',
            originalUrl: 'http://localhost?hint1=foo&foo=bar&xxx=1',
            headers: {
                accept: 'text/html',
            },
            query: {

            },
            session: {
                regenerate(cb: (err: Error | null) => void) { cb(null); sessionRegenerated = true; },
            },
        };
        const res: any = {
        };
        const aclChecker: any = {};
        const securityProviderRegistry: any = {
            findProvider() {
                return {
                    getUser() {
                        return null;
                    },
                    async authenticate(req: any, res: any, authenticationHints: any) {
                        return {
                            status: 'deferred',
                        }
                    }
                }
            }
        };

        const securityService = new MashroomSecurityService('testProvider', ['hint1', 'hint5'], securityProviderRegistry, aclChecker);

        await securityService.authenticate(req, res);

        expect(sessionRegenerated).toBeTruthy();
    });

    it('forwards query parameter hints to the provider', async () => {
        const req: any = {
            pluginContext: {
                loggerFactory
            },
            url: 'http://localhost?hint1=foo&foo=bar&xxx=1',
            originalUrl: 'http://localhost?hint1=foo&foo=bar&xxx=1',
            headers: {
                accept: 'xxxx',
            },
            query: {
                hint1: 'foo',
                foo: 'bar',
                xxx: 1,
            },
            session: {
                regenerate(cb: (err: Error | null) => void) { cb(null); },
            },
        };
        const res: any = {
        };
        const aclChecker: any = {};
        let receivedAuthenticationHints;
        const securityProviderRegistry: any = {
            findProvider() {
                return {
                    getUser() {
                        return null;
                    },
                    async authenticate(req: any, res: any, authenticationHints: any) {
                        receivedAuthenticationHints = authenticationHints;
                        return {
                            status: 'deferred',
                        }
                    }
                }
            }
        };

        const securityService = new MashroomSecurityService('testProvider', ['hint1', 'hint5'], securityProviderRegistry, aclChecker);

        await securityService.authenticate(req, res);

        expect(receivedAuthenticationHints).toBeTruthy();
        expect(receivedAuthenticationHints).toEqual({
            hint1: 'foo',
        });
        expect(req.url).toBe('http://localhost?foo=bar&xxx=1');
        expect(req.originalUrl).toBe('http://localhost?foo=bar&xxx=1');
    });

    it('checks the resource permission', async () => {

        const user: any = {
            roles: ['Role2']
        };
        const aclChecker: any = {};
        const securityProviderRegistry: any = {
            findProvider() {
                return {
                    getUser: () => user
                }
            }
        };

        const request: any = {
            pluginContext: {
                loggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection() {
                                return {
                                    findOne({key}: any) {
                                        if (key === 'page1') {
                                            return {
                                                type: 'Page',
                                                key: 'page1',
                                                permissions: [{
                                                    permissions: ['View'],
                                                    roles: ['Role1', 'Role2']
                                                }]
                                            };
                                        } else if (key === 'page2') {
                                            return {
                                                type: 'Page',
                                                key: 'page2',
                                                permissions: [{
                                                    permissions: ['View'],
                                                    roles: ['Role3']
                                                }]
                                            };
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        const securityService = new MashroomSecurityService('testProvider', null, securityProviderRegistry, aclChecker);

        const permittedPage1 = await securityService.checkResourcePermission(request, 'Page', 'page1', 'View', false);
        const permittedPage2 = await securityService.checkResourcePermission(request, 'Page', 'page2', 'View', false);
        const permittedUndefinedResource = await securityService.checkResourcePermission(request, 'Page', 'foo', 'View', false);

        expect(permittedPage1).toBeTruthy();
        expect(permittedPage2).toBeFalsy();
        expect(permittedUndefinedResource).toBeFalsy();
    });

    it('delegates to the acl checker', async () => {
        const req: any = {
            pluginContext: {
                loggerFactory
            },
            path: '/test',
            method: 'GET'
        };
        const aclChecker: any = {
            allowed: jest.fn()
        };
        const securityProviderRegistry: any = {
            findProvider() {
                return {
                    getUser() {
                        return {
                            username: 'john',
                            roles: ['Role2']
                        };
                    }
                }
            }
        };

        const securityService = new MashroomSecurityService('testProvider', null, securityProviderRegistry, aclChecker);

        expect(await securityService.checkACL(req)).toBeFalsy();
        expect(aclChecker.allowed.mock.calls.length).toBe(1);
        expect(aclChecker.allowed.mock.calls[0][0]).toEqual(req);
        expect(aclChecker.allowed.mock.calls[0][1]).toEqual({
            username: 'john',
            roles: ['Role2', 'Authenticated']
        });
    });

    it('don\'t allow login with empty username or password', async () => {
        const req: any = {
            pluginContext: {
                loggerFactory
            }
        };

        let providerLoginCalled = false;
        const aclChecker: any = {};
        const securityProviderRegistry: any = {
            findProvider() {
                return {
                    login() {
                        providerLoginCalled = true;
                        return null;
                    }
                }
            }
        };

        const securityService = new MashroomSecurityService('testProvider', null, securityProviderRegistry, aclChecker);

        const result = await securityService.login(req, '', '  ');

        expect(providerLoginCalled).toBeFalsy();
        expect(result).toEqual({
            failureReason: 'Invalid credentials',
            success: false
        });
    });

});
