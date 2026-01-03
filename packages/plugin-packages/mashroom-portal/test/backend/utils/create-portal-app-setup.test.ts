
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import {createPortalAppSetup} from '../../../src/backend/utils/create-portal-app-setup';
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomPortalApp} from '../../../type-definitions';

setPortalPluginConfig({
   path: '/portal',
} as any);

const portalApp1: MashroomPortalApp = {
    name: 'Test Portal App 1',
    title: null,
    description: null,
    tags: [],
    version: '1.0',
    homepage: null,
    author: null,
    license: null,
    category: null,
    metaInfo: null,
    lastReloadTs: 222222222,
    packageUrl: new URL(`file://${__dirname}`),
    clientBootstrap: 'foo',
    resourcesRootUrl: `file://${__dirname}`,
    remoteApp: false,
    ssrBootstrap: undefined,
    ssrInitialHtmlUrl: undefined,
    cachingConfig: undefined,
    editorConfig: undefined,
    resources: {
        moduleSystem: 'none',
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: null,
    screenshots: null,
    defaultRestrictViewToRoles: null,
    rolePermissions: {
        delete: ['role3'],
    },
    proxies: {
        'my-proxy': {
            targetUri: 'https://www.mashroom-server.com/api',
        },
        'my-ws-proxy': {
            targetUri: 'wss://www.mashroom-server.com/ws',
        },
    },
    defaultAppConfig: {
        hello: 'world',
        foo: 'bar',
    },
};

const portalApp2: MashroomPortalApp = {
    name: 'Test Portal App 2',
    title: null,
    description: null,
    tags: [],
    version: '1.0',
    homepage: null,
    author: null,
    license: null,
    category: null,
    metaInfo: null,
    lastReloadTs: 222222222,
    packageUrl: new URL(`file://${__dirname}`),
    clientBootstrap: 'foo',
    resourcesRootUrl: `file://${__dirname}`,
    remoteApp: false,
    ssrBootstrap: undefined,
    ssrInitialHtmlUrl: undefined,
    cachingConfig: undefined,
    editorConfig: undefined,
    resources: {
        moduleSystem: 'SystemJS',
        importMap: {
            imports: {
                module1: 'https://example.com/module1.js',
                module2: 'https://example.com/module2.js',
            }
        },
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: null,
    screenshots: null,
    defaultRestrictViewToRoles: null,
    rolePermissions: null,
    proxies: {
        'my-proxy': {
            targetUri: 'https://www.mashroom-server.com/api',
        },
        'my-ws-proxy': {
            targetUri: 'wss://www.mashroom-server.com/ws',
        },
    },
    defaultAppConfig: {
        hello: 'world',
        foo: 'bar',
    },
};

const user1: MashroomSecurityUser = {
    username: 'test',
    displayName: 'Test User',
    email: null,
    roles: ['role1', 'role3'],
    extraData: null,
    pictureUrl: null,
    secrets: null,
};

const pluginRegistry: any = {
    portalAppEnhancements: [],
    portalAppConfigs: [],
};

const pluginRegistry2: any = {
    portalAppEnhancements: [{
        name: 'Test Portal App Enhancement 1',
        plugin: {
            enhancePortalAppSetup: (appSetup: any) => {
                return {
                    ...appSetup,
                    enhanced: 1,
                };
            }
        }
    }],
    portalAppConfigs: [{
        name: 'Test Portal App Config 1',
        plugin: {
            applyTo: (portalAppName: string) => portalAppName === 'Test Portal App 2',
            determineRolePermissions: async () => {
                return {
                    perm1: false,
                    perm2: true,
                };
            },
            rewriteImportMap: () => ({
                imports: {
                    module1: 'https://example2.com/module1.js',
                    module2: 'https://example2.com/module2.js',
                }
            })
        }
    }],
};

const pluginContext = {
    loggerFactory: dummyLoggerFactory,
    services: {
        i18n: {
            service: {
                getLanguage: () => 'en',
            },
        }
    },
    serverInfo: {}
};

describe('create-portal-app-setup', () => {

    it('creates Portal App setup', async () => {
        const overrideConfig = {
            hello: 'world 2',
        };
        const req: any = {
            params: {
              sitePath: 'site1',
            },
            pluginContext,
        };

        const setup = await createPortalAppSetup(
            portalApp1,
            undefined,
            overrideConfig,
            user1,
            pluginRegistry,
            req);

        expect(setup).toMatchObject({
            appConfig: {
                foo: 'bar',
                hello: 'world 2'
            },
            clientBootstrapName: 'foo',
            lang: 'en',
            lastReloadTs: 222222222,
            pluginName: 'Test Portal App 1',
            proxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%201',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-ws-proxy'
            },
            resources: {
                css: [],
                js: [
                    'bundle.js'
                ],
                moduleSystem: 'none'
            },
            resourcesBasePath: '/portal/site1/___/apps/Test%20Portal%20App%201',
            restProxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%201',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-ws-proxy'
            },
            serverSideRendered: false,
            sharedResources: null,
            sharedResourcesBasePath: '/portal/site1/___/apps/___shared___',
            title: null,
            user: {
                displayName: 'Test User',
                email: null,
                guest: false,
                permissions: {
                    delete: true,
                },
                username: 'test'
            },
            version: '1.0',
            versionHash: 'e4c2e8edac'
        });
    });

    it('creates Portal App setup for a specific instance', async () => {
        const overrideConfig = {
            hello: 'world 2',
        };
        const req: any = {
            params: {
                sitePath: 'site1',
            },
            pluginContext,
        };

        const instance = {
            pluginName: portalApp1.name,
            instanceId: '123456789',
            appConfig: {
                foo: 'bar2',
            }
        };

        const setup = await createPortalAppSetup(
            portalApp1,
            instance,
            overrideConfig,
            user1,
            pluginRegistry,
            req);

        expect(setup).toEqual({
            appConfig: {
                foo: 'bar2',
                hello: 'world 2'
            },
            appId: '123456789',
            instanceId: '123456789',
            clientBootstrapName: 'foo',
            lang: 'en',
            lastReloadTs: 222222222,
            pluginName: 'Test Portal App 1',
            proxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%201',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-ws-proxy'
            },
            resources: {
                css: [],
                js: [
                    'bundle.js'
                ],
                moduleSystem: 'none'
            },
            resourcesBasePath: '/portal/site1/___/apps/Test%20Portal%20App%201',
            restProxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%201',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-ws-proxy'
            },
            serverSideRendered: false,
            sharedResources: null,
            sharedResourcesBasePath: '/portal/site1/___/apps/___shared___',
            title: null,
            user: {
                displayName: 'Test User',
                email: null,
                guest: false,
                permissions: {
                    delete: true,
                },
                username: 'test'
            },
            version: '1.0',
            versionHash: 'e4c2e8edac'
        });
    });

    it('applies app enhancement plugins', async () => {
        const req: any = {
            params: {
                sitePath: 'site1',
            },
            pluginContext,
        };

        const setup = await createPortalAppSetup(
            portalApp1,
            undefined,
            undefined,
            undefined,
            pluginRegistry2,
            req);

        expect(setup).toMatchObject({
            enhanced: 1,
            appConfig: {
                foo: 'bar',
                hello: 'world'
            },
            clientBootstrapName: 'foo',
            lang: 'en',
            lastReloadTs: 222222222,
            pluginName: 'Test Portal App 1',
            proxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%201',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-ws-proxy'
            },
            resources: {
                css: [],
                js: [
                    'bundle.js'
                ],
                moduleSystem: 'none'
            },
            resourcesBasePath: '/portal/site1/___/apps/Test%20Portal%20App%201',
            restProxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%201',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-ws-proxy'
            },
            serverSideRendered: false,
            sharedResources: null,
            sharedResourcesBasePath: '/portal/site1/___/apps/___shared___',
            title: null,
            user: {
                displayName: 'Anonymous',
                email: null,
                guest: true,
                permissions: {},
                username: 'anonymous'
            },
            version: '1.0',
            versionHash: 'e4c2e8edac'
        });
    });

    it('rewrites resource URLs when a CDN path is present', async () => {
        const req: any = {
            params: {
                sitePath: 'site1',
            },
            pluginContext: {
                ...pluginContext,
                services: {
                    ...pluginContext.services,
                    cdn: {
                        service: {
                           getCDNHost: () => 'https://cdn.example.com',
                        }
                    }
                }
            }
        };

        const setup = await createPortalAppSetup(
            portalApp1,
            undefined,
            undefined,
            undefined,
            pluginRegistry2,
            req);

        expect(setup).toMatchObject({
            enhanced: 1,
            appConfig: {
                foo: 'bar',
                hello: 'world'
            },
            clientBootstrapName: 'foo',
            lang: 'en',
            lastReloadTs: 222222222,
            pluginName: 'Test Portal App 1',
            proxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%201',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-ws-proxy'
            },
            resources: {
                css: [],
                js: [
                    'bundle.js'
                ],
                moduleSystem: 'none'
            },
            resourcesBasePath: 'https://cdn.example.com/portal/site1/___/apps/Test%20Portal%20App%201',
            restProxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%201',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%201/my-ws-proxy'
            },
            serverSideRendered: false,
            sharedResources: null,
            sharedResourcesBasePath: 'https://cdn.example.com/portal/site1/___/apps/___shared___',
            title: null,
            user: {
                displayName: 'Anonymous',
                email: null,
                guest: true,
                permissions: {},
                username: 'anonymous'
            },
            version: '1.0',
            versionHash: 'e4c2e8edac'
        });
    });

    it('applies Portal App config plugins', async () => {
        const req: any = {
            params: {
                sitePath: 'site1',
            },
            pluginContext,
        };

        const setup = await createPortalAppSetup(
            portalApp2,
            undefined,
            undefined,
            undefined,
            pluginRegistry2,
            req);

        expect(setup).toMatchObject({
            appConfig: {
                foo: 'bar',
                hello: 'world'
            },
            clientBootstrapName: 'foo',
            enhanced: 1,
            lang: 'en',
            lastReloadTs: 222222222,
            pluginName: 'Test Portal App 2',
            proxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%202',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%202/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%202/my-ws-proxy'
            },
            resources: {
                css: [],
                importMap: {
                    imports: {
                        module1: 'https://example2.com/module1.js',
                        module2: 'https://example2.com/module2.js'
                    }
                },
                js: [
                    'bundle.js'
                ],
                moduleSystem: 'SystemJS'
            },
            resourcesBasePath: '/portal/site1/___/apps/Test%20Portal%20App%202',
            restProxyPaths: {
                __baseUrl: '/portal/site1/___/proxy/Test%20Portal%20App%202',
                'my-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%202/my-proxy',
                'my-ws-proxy': '/portal/site1/___/proxy/Test%20Portal%20App%202/my-ws-proxy'
            },
            serverSideRendered: false,
            sharedResources: null,
            sharedResourcesBasePath: '/portal/site1/___/apps/___shared___',
            title: null,
            user: {
                displayName: 'Anonymous',
                email: null,
                guest: true,
                permissions: {
                    perm1: false,
                    perm2: true,
                },
                username: 'anonymous'
            },
            version: '1.0',
            versionHash: 'e4c2e8edac'
        });
    });
});
