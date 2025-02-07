
import {Writable} from 'stream';
import {loggingUtils} from '@mashroom/mashroom-utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import PortalAppController from '../../../src/backend/controllers/PortalAppController';

import type {
    MashroomPortalApp,
    MashroomPortalAppEnhancement,
    MashroomPortalAppInstance,
    MashroomPortalPage
} from '../../../type-definitions';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    authenticationExpiration: {
        warnBeforeExpirationSec: 120,
        autoExtend: false,
        onExpiration: {strategy: 'reload'},
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

const portalApp1: MashroomPortalApp = {
    name: 'Test Portal App 1',
    title: {
        en: 'Test Portal App',
        de: 'Test Test Test'
    },
    description: null,
    tags: [],
    version: '1.0',
    homepage: 'https://www.mashroom-server.com',
    author: null,
    license: null,
    category: 'demo',
    metaInfo: null,
    lastReloadTs: 2222,
    clientBootstrap: 'foo',
    resourcesRootUri: `file://${__dirname}`,
    remoteApp: false,
    ssrBootstrap: undefined,
    ssrInitialHtmlUri: undefined,
    cachingConfig: undefined,
    editorConfig: undefined,
    resources: {
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: {
        js: [],
        css: [],
    },
    screenshots: ['screenshot.png'],
    defaultRestrictViewToRoles: ['Role1'],
    rolePermissions: {
        edit: ['Role1'],
        delete: ['Administrator']
    },
    proxies: {
        1: {
            targetUri: 'https://www.mashroom-server.com/api',
        },
    },
    defaultAppConfig: {
        hello: 'world',
        foo: 'bar',
    },
};

const portalApp2: MashroomPortalApp = {
    name: 'Test Portal App 2',
    title: {},
    description: null,
    tags: [],
    version: '1.0',
    homepage: null,
    author: null,
    license: null,
    category: null,
    metaInfo: null,
    lastReloadTs: 1111,
    clientBootstrap: 'foo',
    resourcesRootUri: `file:/${__dirname}`,
    remoteApp: false,
    ssrBootstrap: undefined,
    ssrInitialHtmlUri: undefined,
    cachingConfig: undefined,
    editorConfig: undefined,
    resources: {
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: {
        js: [],
        css: [],
    },
    screenshots: null,
    defaultRestrictViewToRoles: ['OtherRole'],
    rolePermissions: {},
    proxies: {},
    defaultAppConfig: {},
};

const portalApp3: MashroomPortalApp = {
    name: 'Test Remote App',
    title: {},
    description: null,
    tags: [],
    version: '1.0',
    homepage: null,
    author: null,
    license: null,
    category: null,
    metaInfo: null,
    lastReloadTs: 4444,
    clientBootstrap: 'foo',
    resourcesRootUri: `http://my.host.com`,
    remoteApp: false,
    ssrBootstrap: undefined,
    ssrInitialHtmlUri: undefined,
    cachingConfig: undefined,
    editorConfig: undefined,
    resources: {
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: {
        js: [],
        css: [],
    },
    screenshots: null,
    defaultRestrictViewToRoles: ['OtherRole'],
    rolePermissions: {},
    proxies: {
        bff: {
            targetUri: 'http://my.host.com/api',
        },
    },
    defaultAppConfig: {},
};

const portalAppInstance1: MashroomPortalAppInstance = {
    pluginName: 'Test Portal App 1',
    instanceId: 'ABCD',
    appConfig: {
        hello: 'peter',
    },
};

const page1: MashroomPortalPage = {
    pageId: 'foo',
    portalApps: {
        area1: [{
            pluginName: 'Test Portal App 1',
            instanceId: 'ABCD',
        }],
    },
};

const portalAppEnhancement1: MashroomPortalAppEnhancement = {
    name: 'Test Enhancement 1',
    description: null,
    portalCustomClientServices: {},
    plugin: {
        enhancePortalAppSetup: (portalAppSetup, portalApp, req) => Promise.resolve({
            ...portalAppSetup,
            user: {
                ...portalAppSetup.user,
                extraData: 'foo',
            }
        })
    }
};

const portalAppEnhancement2: MashroomPortalAppEnhancement = {
    name: 'Test Enhancement 2',
    description: null,
    portalCustomClientServices: {},
    plugin: {
        enhancePortalAppSetup: (portalAppSetup, portalApp, req) => Promise.resolve({
            ...portalAppSetup,
            user: {
                ...portalAppSetup.user,
                extraData: 'foo',
                extraData2: 'bar',
            }
        })
    }
};

const pluginRegistry: any = {
    portalApps: [portalApp1, portalApp2, portalApp3],
    portalAppEnhancements: [portalAppEnhancement1, portalAppEnhancement2],
};

const pluginContext: any = {
    loggerFactory: loggingUtils.dummyLoggerFactory,
    serverInfo: {
        devMode: false,
    },
    services: {
        portal: {
            service: {
                async findSiteByPath() {
                    return {};
                },
                async getPage() {
                    return page1;
                },
                async getPortalAppInstance(name: string, id: string) {
                    if (id) {
                        return portalAppInstance1;
                    }
                    return null;
                },
            },
        },
        security: {
            service: {
                getUser() {
                    return {
                        username: 'test',
                        displayName: 'Test User',
                        email: 'test@test.com',
                        roles: ['Role1'],
                    };
                },
                isAdmin() {
                    return false;
                },
                async checkResourcePermission() {
                    return true;
                }
            },
        },
        i18n: {
            service: {
                getLanguage: () => 'en',
                translate: () => 'Translated title'
            },
        },
    },
};

describe('PortalAppController', () => {

    it('generates portal app setup', async () => {

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                sitePath: 'web',
                pageId: '123',
                pluginName: 'Test Portal App 1',
                portalAppInstanceId: 'ABCD',
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        let json = null;
        const res: any = {
            json: (data: string) => json = data,
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getPortalAppSetup(req, res);

        expect(json).toBeTruthy();
        expect(json).toEqual({
            appId: 'ABCD',
            pluginName: 'Test Portal App 1',
            title: 'Translated title',
            version: '1.0',
            instanceId: 'ABCD',
            lastReloadTs: 2222,
            serverSideRendered: false,
            versionHash: 'e4c2e8edac',
            proxyPaths: {
                __baseUrl: '/portal/web/___/proxy/Test%20Portal%20App%201',
                1: '/portal/web/___/proxy/Test%20Portal%20App%201/1',
            },
            restProxyPaths: {
                __baseUrl: '/portal/web/___/proxy/Test%20Portal%20App%201',
                1: '/portal/web/___/proxy/Test%20Portal%20App%201/1',
            },
            resourcesBasePath: '/portal/web/___/apps/Test%20Portal%20App%201',
            sharedResourcesBasePath: '/portal/web/___/apps/___shared___',
            sharedResources: {
                js: [],
                css: [],
            },
            resources: {css: [], js: ['bundle.js']},
            globalLaunchFunction: 'foo',
            lang: 'en',
            user: {
                guest: false,
                username: 'test',
                displayName: 'Test User',
                email: 'test@test.com',
                permissions: {
                    edit: true
                },
                extraData: 'foo',
                extraData2: 'bar'
            },
            appConfig: {
                hello: 'peter',
                foo: 'bar',
            },
        });
    });

    it('generates portal app setup for a dynamically loaded app', async () => {

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                sitePath: 'web',
                pageId: '123',
                pluginName: 'Test Portal App 1',
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        let json: any = null;
        const res: any = {
            json: (data: string) => json = data,
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getPortalAppSetup(req, res);

        expect(json).toBeTruthy();
        expect(json.appId).toBeTruthy();
        delete json.appId;
        expect(json).toEqual({
            pluginName: 'Test Portal App 1',
            title: 'Translated title',
            version: '1.0',
            instanceId: null,
            lastReloadTs: 2222,
            serverSideRendered: false,
            versionHash: 'e4c2e8edac',
            proxyPaths: {
                __baseUrl: '/portal/web/___/proxy/Test%20Portal%20App%201',
                1: '/portal/web/___/proxy/Test%20Portal%20App%201/1',
            },
            restProxyPaths: {
                __baseUrl: '/portal/web/___/proxy/Test%20Portal%20App%201',
                1: '/portal/web/___/proxy/Test%20Portal%20App%201/1',
            },
            resourcesBasePath: '/portal/web/___/apps/Test%20Portal%20App%201',
            sharedResourcesBasePath: '/portal/web/___/apps/___shared___',
            sharedResources: {
                js: [],
                css: [],
            },
            resources: {css: [], js: ['bundle.js']},
            globalLaunchFunction: 'foo',
            lang: 'en',
            user: {
                guest: false,
                username: 'test',
                displayName: 'Test User',
                email: 'test@test.com',
                permissions: {
                    edit: true
                },
                extraData: 'foo',
                extraData2: 'bar'
            },
            appConfig: {
                hello: 'world',
                foo: 'bar',
            },
        });
    });

    it('rejects dynamical app setup when the user has none of defaultRestrictViewToRoles', (done) => {

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                pluginName: 'Test Portal App 2',
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        const res: any = {
            sendStatus: (status: number) => {
                expect(status).toBe(403);
                done();
            }
        };

        const controller = new PortalAppController(pluginRegistry);
        controller.getPortalAppSetup(req, res);
    });

    it('loads resources from the filesystem', (done) => {
        const req: any = {
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                pluginName: 'Test Portal App 1',
                0: '/PortalAppController.test.ts',
            },
            pluginContext,
            query: {},
        };

        const res: any = new Writable({
            write: (chunk, encoding, cb) => {
                cb();
            },
            final: (cb) => {
                cb();
                done();
            },
        });
        res.setHeader = () => { /* nothing to do */
        };
        res.type = () => { /* nothing to do */
        };
        res.set = () => { /* nothing to do */
        };
        res.sendStatus = () => { /* nothing to do */
        };

        const controller = new PortalAppController(pluginRegistry);
        controller.getPortalAppResource(req, res);
    });

    it('disallows API access via resource URLs', () => {
        const req: any = {
            params: {
                pluginName: 'Test Remote App',
                0: 'api/customers',
            },
            pluginContext,
            query: {},
        };

        let status;
        const res: any = {
            sendStatus: (stat: number) => {
                status = stat;
            }
        };

        const controller = new PortalAppController(pluginRegistry);
        controller.getPortalAppResource(req, res);

        expect(status).toBe(401);
    });

    it('returns all known and permitted Portal Apps', async () => {
        const req: any = {
            params: {
                pluginName: 'Test Remote App',
                0: 'api/customers',
            },
            pluginContext,
            query: {},
        };

        let json: Array<any> | undefined;
        const res: any = {
            json: (_json: any) => {
                json = _json;
            }
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getKnownPortalApps(req, res);

        expect(json).toBeTruthy();
        expect(json!.length).toBe(1);
        expect(json).toEqual([{
            available: true,
            category: 'demo',
            description: null,
            homepage: 'https://www.mashroom-server.com',
            lastReloadTs: 2222,
            metaInfo: null,
            name: 'Test Portal App 1',
            requiredRoles: [
                'Role1'
            ],
            screenshots: [
                '/portal/___/apps/Test%20Portal%20App%201/screenshot.png'
            ],
            tags: [],
            title: 'Translated title',
            version: '1.0'
        }]);
    });

    it('returns all known Portal Apps', async () => {
        const req: any = {
            params: {
                pluginName: 'Test Remote App',
                0: 'api/customers',
            },
            pluginContext,
            query: {
                includeNotPermitted: '1',
            },
        };

        let json: Array<any> | undefined;
        const res: any = {
            json: (_json: any) => {
                json = _json;
            }
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getKnownPortalApps(req, res);

        expect(json).toBeTruthy();
        expect(json!.length).toBe(3);
        expect(json).toEqual([{
            available: true,
            category: 'demo',
            description: null,
            homepage: 'https://www.mashroom-server.com',
            lastReloadTs: 2222,
            metaInfo: null,
            name: 'Test Portal App 1',
            requiredRoles: [
                'Role1'
            ],
            screenshots: [
                '/portal/___/apps/Test%20Portal%20App%201/screenshot.png'
            ],
            tags: [],
            title: 'Translated title',
            version: '1.0'
        },
        {
            available: false,
            category: null,
            lastReloadTs: 1111,
            name: 'Test Portal App 2',
            requiredRoles: [
                'OtherRole'
            ],
            title: 'Translated title',
            unavailableReason: 'forbidden',
            version: '1.0'
        },
        {
            available: false,
            category: null,
            lastReloadTs: 4444,
            name: 'Test Remote App',
            requiredRoles: [
                'OtherRole'
            ],
            title: 'Translated title',
            unavailableReason: 'forbidden',
            version: '1.0'
        }]);
    });

    it('filters known Portal Apps by name', async () => {
        const req: any = {
            params: {
                pluginName: 'Test Remote App',
                0: 'api/customers',
            },
            pluginContext,
            query: {
                includeNotPermitted: '1',
                q: 'remote'
            },
        };

        let json: Array<any> | undefined;
        const res: any = {
            json: (_json: any) => {
                json = _json;
            }
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getKnownPortalApps(req, res);

        expect(json).toBeTruthy();
        expect(json!.length).toBe(1);
        expect(json).toEqual([{
            available: false,
            lastReloadTs: 4444,
            name: 'Test Remote App',
            category: null,
            requiredRoles: [
                'OtherRole'
            ],
            title: 'Translated title',
            unavailableReason: 'forbidden',
            version: '1.0'
        }]);
    });

    it('filters known Portal Apps by title', async () => {
        const req: any = {
            params: {
                pluginName: 'Test Remote App',
                0: 'api/customers',
            },
            pluginContext,
            query: {
                includeNotPermitted: '1',
                q: 'Test Test Test'
            },
        };

        let json: Array<any> | undefined;
        const res: any = {
            json: (_json: any) => {
                json = _json;
            }
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getKnownPortalApps(req, res);

        expect(json).toBeTruthy();
        expect(json!.length).toBe(1);
        expect(json).toEqual([{
            available: true,
            category: 'demo',
            description: null,
            homepage: 'https://www.mashroom-server.com',
            lastReloadTs: 2222,
            metaInfo: null,
            name: 'Test Portal App 1',
            requiredRoles: [
                'Role1'
            ],
            screenshots: [
                '/portal/___/apps/Test%20Portal%20App%201/screenshot.png'
            ],
            tags: [],
            title: 'Translated title',
            version: '1.0'
        }]);
    });

    it('filters known Portal Apps by last reload timestamp', async () => {
        const req: any = {
            params: {
                pluginName: 'Test Remote App',
                0: 'api/customers',
            },
            pluginContext,
            query: {
                includeNotPermitted: '1',
                updatedSince: '1112',
            },
        };

        let json: Array<any> | undefined;
        const res: any = {
            json: (_json: any) => {
                json = _json;
            }
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getKnownPortalApps(req, res);

        expect(json).toBeTruthy();
        expect(json!.length).toBe(2);
        expect(json).toEqual([{
            available: true,
            category: 'demo',
            description: null,
            homepage: 'https://www.mashroom-server.com',
            lastReloadTs: 2222,
            metaInfo: null,
            name: 'Test Portal App 1',
            requiredRoles: [
                'Role1'
            ],
            screenshots: [
                '/portal/___/apps/Test%20Portal%20App%201/screenshot.png'
            ],
            tags: [],
            title: 'Translated title',
            version: '1.0'
        },
        {
            available: false,
            category: null,
            lastReloadTs: 4444,
            name: 'Test Remote App',
            requiredRoles: [
                'OtherRole'
            ],
            title: 'Translated title',
            unavailableReason: 'forbidden',
            version: '1.0'
        }]);
    });
});
