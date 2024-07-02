
import {loggingUtils} from '@mashroom/mashroom-utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import PortalUserController from '../../../src/backend/controllers/PortalUserController';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    authenticationExpiration: {
        warnBeforeExpirationSec: 120,
        autoExtend: false,
        onExpiration: { strategy: 'reload' },
    },
    ignoreMissingAppsOnPages: false,
    versionHashSalt: null,
    resourceFetchConfig: {
        fetchTimeoutMs: 3000,
        httpMaxSocketsPerHost: 10,
        httpRejectUnauthorized: true,
    },
    defaultProxyConfig: {},
    ssrConfig: {
        ssrEnable: false,
        renderTimoutMs: 2000,
        cacheEnable: false,
        cacheTTLSec: 300,
        inlineStyles: true,
    }
});

describe('PortalUserController', () => {

    it('sends the correct auth expiration time', async () => {
        const controller = new PortalUserController();

        let sentJson = null;
        const req: any = {
            params: {
                sitePath: 'web',
            },
            headers: {
                accept: 'text/*',
            },
            query: {

            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            getAuthenticationExpiration: () => 123456789,
                        }
                    }
                }
            }
        };
        const res: any = {
            json: (json: any) => sentJson = json,
        };

        await controller.getAuthenticatedUserAuthenticationExpirationTime(req, res);

        expect(sentJson).toEqual({
            expirationTime: 123456789,
        });
    });

    it('sends the correct time to auth expiration', async () => {
        const controller = new PortalUserController();

        let sentJson = null;
        const req: any = {
            params: {
                sitePath: 'web',
            },
            headers: {
                accept: 'text/*',
            },
            query: {

            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            getAuthenticationExpiration: () => Date.now() + 10000,
                        }
                    }
                }
            }
        };
        const res: any = {
            json: (json: any) => sentJson = json,
        };

        await controller.getAuthenticatedUserTimeToAuthenticationExpiration(req, res);

        expect(sentJson).toEqual({
            timeToExpiration: 10000,
        });
    });

    it('updates the user language', async () => {
        const controller = new PortalUserController();

        const mockSetLanguage = jest.fn();
        const req: any = {
            body: {
                lang: 'fr',
            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    i18n: {
                        service: {
                            setLanguage: mockSetLanguage,
                            availableLanguages: ['en', 'fr', 'de'],
                        }
                    }
                }
            }
        };
        const res: any = {
            end: () => { /* nothing to do */ },
        };

        await controller.setAuthenticatedUserLanguage(req, res);

        expect(mockSetLanguage.mock.calls.length).toBe(1);
        expect(mockSetLanguage.mock.calls[0][0]).toBe('fr');
    });

    it('does not update the user language if it is not in the available languages', async () => {
        const controller = new PortalUserController();

        const mockSetLanguage = jest.fn();
        const req: any = {
            body: {
                lang: 'zh',
            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    i18n: {
                        service: {
                            setLanguage: mockSetLanguage,
                            availableLanguages: ['en', 'fr', 'de'],
                        }
                    }
                }
            }
        };
        const res: any = {
            end: () => { /* nothing to do */ },
        };

        await controller.setAuthenticatedUserLanguage(req, res);

        expect(mockSetLanguage.mock.calls.length).toBe(0);
    });

    it('redirects to the site index after logout', async () => {
        const controller = new PortalUserController();

        let redirectUrl = null;
        const mockRevokeAuthentication = jest.fn();
        const req: any = {
            method: 'GET',
            params: {
                sitePath: 'web',
            },
            headers: {
                accept: 'text/html',
            },
            query: {

            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            revokeAuthentication: mockRevokeAuthentication,
                            getUser: () => Promise.resolve({}),
                        }
                    }
                }
            }
        };
        const res: any = {
            redirect: (url: string) => redirectUrl = url,
        };

        await controller.logout(req, res);

        expect(mockRevokeAuthentication.mock.calls.length).toBe(1);
        expect(redirectUrl).toBe('/portal/web');
    });

    it('is uses the redirect query parameter after logout', async () => {
        const controller = new PortalUserController();

        let redirectUrl = null;
        const mockRevokeAuthentication = jest.fn();
        const req: any = {
            method: 'GET',
            params: {
                sitePath: 'web',
            },
            headers: {
                accept: 'text/html'
            },
            query: {
                redirectUrl: '/foo/bar',
            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            revokeAuthentication: mockRevokeAuthentication,
                            getUser: () => Promise.resolve({}),
                        }
                    }
                }
            }
        };
        const res: any = {
            redirect: (url: string) => redirectUrl = url,
        };

        await controller.logout(req, res);

        expect(mockRevokeAuthentication.mock.calls.length).toBe(1);
        expect(redirectUrl).toBe('/foo/bar');
    });

});
