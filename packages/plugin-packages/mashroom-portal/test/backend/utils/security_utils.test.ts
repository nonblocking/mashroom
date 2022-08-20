
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {isSitePermitted, isSitePathPermitted, isPagePermitted, isAppPermitted, isProxyAccessPermitted} from '../../../src/backend/utils/security_utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';

const portalConfig: any = {
    path: '/portal',
};
setPortalPluginConfig(portalConfig);

describe('security_utils', () => {

    it('checks site resource permission', async () => {
        const checkResourcePermission = jest.fn();
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                security: {
                    service: {
                        checkResourcePermission,
                    },
                }
            }
        };
        const req: any = {
            pluginContext,
        };

        checkResourcePermission.mockReturnValue(Promise.resolve(true));
        const permitted = await isSitePermitted(req, 'site123');

        expect(permitted).toBe(true);
        expect(checkResourcePermission.mock.calls[0]).toEqual([
            req,
            'Site',
            'site123',
            'View',
            true,
        ]);
    });

    it('checks site resource permission by path', async () => {
        const checkResourcePermission = jest.fn();
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                security: {
                    service: {
                        checkResourcePermission,
                    },
                },
                portal: {
                    service: {
                        async findSiteByPath(path: string) {
                            if (path === '/web') {
                                return {
                                    siteId: 'site3',
                                };
                            }
                            return null;
                        },
                    },
                },
            }
        };
        const req: any = {
            pluginContext,
        };

        checkResourcePermission.mockReturnValue(Promise.resolve(true));
        const permitted = await isSitePathPermitted(req, '/web');

        expect(permitted).toBe(true);
        expect(checkResourcePermission.mock.calls[0]).toEqual([
            req,
            'Site',
            'site3',
            'View',
            true,
        ]);
    });

    it('checks page resource permission', async () => {
        const checkResourcePermission = jest.fn();
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                security: {
                    service: {
                        checkResourcePermission,
                    },
                }
            }
        };
        const req: any = {
            pluginContext,
        };

        checkResourcePermission.mockReturnValue(Promise.resolve(true));
        const permitted = await isPagePermitted(req, 'page55');

        expect(permitted).toBe(true);
        expect(checkResourcePermission.mock.calls[0]).toEqual([
            req,
            'Page',
            'page55',
            'View',
            true,
        ]);
    });

    it('checks portal app instance resource permission', async () => {
        const checkResourcePermission = jest.fn();
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                security: {
                    service: {
                        checkResourcePermission,
                    },
                }
            }
        };
        const req: any = {
            pluginContext,
        };

        checkResourcePermission.mockReturnValue(Promise.resolve(true));
        const permitted = await isAppPermitted(req, 'Test Portal App 1', 'instance1234', null);

        expect(permitted).toBe(true);
        expect(checkResourcePermission.mock.calls[0]).toEqual([
            req,
            'Portal-App',
            'Test Portal App 1_instance1234',
            'View',
            true,
        ]);
    });

    it('checks the defaultRestrictViewToRoles property for dynamically loaded portal apps', async () => {
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                security: {
                    service: {
                        isAdmin() {
                            return false;
                        },
                        getUser() {
                            return {
                                roles: ['Role2', 'Role1'],
                            };
                        },
                    },
                }
            }
        };
        const req: any = {
            pluginContext,
        };

        const portalApp: any = {
            name: 'Test Portal App 1',
            defaultRestrictViewToRoles: null,
        };
        const portalApp1: any = {
            name: 'Test Portal App 1',
            defaultRestrictViewToRoles: ['Role1'],
        };
        const portalApp2: any = {
            name: 'Test Portal App 1',
            defaultRestrictViewToRoles: ['Role5'],
        };

        expect(await isAppPermitted(req, 'Test Portal App 1', null, portalApp)).toBe(true);
        expect(await isAppPermitted(req, 'Test Portal App 1', null, portalApp1)).toBe(true);
        expect(await isAppPermitted(req, 'Test Portal App 1', null, portalApp2)).toBe(false);
    });

    it('allows the Administrator role to access all portal apps', async () => {
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                security: {
                    service: {
                        isAdmin() {
                            return true;
                        }
                    },
                }
            }
        };
        const req: any = {
            pluginContext,
        };

        const portalApp: any = {
            name: 'Test Portal App 1',
            defaultRestrictViewToRoles: ['Role1'],
        };

        expect(await isAppPermitted(req, 'Test Portal App 1', null, portalApp)).toBe(true);
    });

    it('checks the restrictToRoles property for proxy accesses', async () => {
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                security: {
                    service: {
                        getUser() {
                            return {
                                roles: ['Role2'],
                            };
                        },
                    },
                }
            }
        };
        const req: any = {
            originalUrl: '/portal/web/test/__/proxy/Test Portal App 1/my-proxy/foo/bar?x=1',
            pluginContext,
        };
        const restProxyDef: any = {
            restrictToRoles: ['Role1'],
        };

        expect(await isProxyAccessPermitted(req, restProxyDef, dummyLoggerFactory())).toBe(false);
    });

    it('does not even allow Administrator role access to a proxy if restrictToRoles is set', async () => {
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                security: {
                    service: {
                        isAdmin() {
                            return true;
                        },
                        getUser() {
                            return {
                            };
                        },
                    },
                }
            }
        };
        const req: any = {
            originalUrl: '/portal/web/test/__/proxy/Test Portal App 1/my-proxy/foo/bar?x=1',
            pluginContext,
        };
        const restProxyDef: any = {
            restrictToRoles: ['Role1'],
        };


        expect(await isProxyAccessPermitted(req, restProxyDef, dummyLoggerFactory())).toBe(false);
    });

});
