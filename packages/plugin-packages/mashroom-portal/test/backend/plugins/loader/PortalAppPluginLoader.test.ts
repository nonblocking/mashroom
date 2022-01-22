
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import PortalAppPluginLoader from '../../../../src/backend/plugins/loader/PortalAppPluginLoader';
import MashroomPortalPluginRegistry from '../../../../src/backend/plugins/MashroomPortalPluginRegistry';

import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';

describe('PortalAppPluginLoader', () => {

    it('loads and registers a portal app v2', () => {

        const pluginPackage: any = {
            pluginPackagePath: '/foo/bar'
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: 'my description',
            tags: ['tag1', 'tag2'],
            type: 'portal-app2',
            errorMessage: null,
            lastReloadTs: Date.now(),
            requireBootstrap: () => { /* nothing to do */ },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal App 1',
                description: null,
                type: 'portal-app2',
                requires: null,
                clientBootstrap: 'startApp',
                resources: {
                    js: [
                        'bundle.js',
                    ],
                    css: [
                        'style.css'
                    ],
                },
                sharedResources: {
                    js: [
                        'globalLib.js'
                    ]
                },
                screenshots: [
                    'screenshot1.png'
                ],
                local: {
                    resourcesRoot: './dist',
                    ssrBootstrap: './dist/renderToString.js'
                },
                remote: {
                    resourcesRoot: '/public',
                    ssrInitialHtmlPath: '/ssr'
                },
                defaultConfig: {
                    title: 'Portal App 1',
                    category: 'Test',
                    tags: ['tag1', 'tag2'],
                    metaInfo: {
                        capabilities: ['foo']
                    },
                    caching: {
                        ssrHtml: 'same-config-and-user'
                    },
                    editor: {
                        editorPortalApp: 'Demo Config Editor',
                        position: 'in-place',
                        appConfig: {
                        }
                    },
                    defaultRestrictViewToRoles: ['Role1'],
                    rolePermissions: {
                        doSomethingSpecial: ['Role2', 'Role3']
                    },
                    proxies: {
                        'whatever': {
                            targetUri: 'https://whatever.com/api',
                            sendPermissionsHeader: false,
                            restrictToRoles: ['Role1']
                        }
                    },
                    appConfig: {
                        firstName: 'John',
                    },
                },
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        if (process.platform !== 'win32') {
            expect(registry.portalApps[0].resourcesRootUri).toBe('file:///foo/bar/dist');
        }
        expect(registry.portalApps[0].description).toBe('my description');
        expect(registry.portalApps[0].title).toEqual('Portal App 1');
        expect(registry.portalApps[0].tags).toEqual(['tag1', 'tag2']);
        expect(registry.portalApps[0].category).toEqual('Test');
        expect(registry.portalApps[0].resources).toEqual({'js': ['bundle.js'], 'css': ['style.css']});
        expect(registry.portalApps[0].sharedResources).toEqual({'js': ['globalLib.js']});
        expect(registry.portalApps[0].clientBootstrap).toEqual('startApp');
        if (process.platform !== 'win32') {
            expect(registry.portalApps[0].ssrBootstrap).toEqual('/foo/bar/dist/renderToString.js');
        }
        expect(registry.portalApps[0].cachingConfig).toEqual({ ssrHtml: 'same-config-and-user' });
        expect(registry.portalApps[0].editorConfig).toEqual({ editorPortalApp: 'Demo Config Editor', position: 'in-place', appConfig: {} });
        expect(registry.portalApps[0].screenshots).toEqual(['screenshot1.png']);
        expect(registry.portalApps[0].proxies).toBeTruthy();
        expect(registry.portalApps[0].metaInfo).toEqual({ capabilities: ['foo'] });
        expect(registry.portalApps[0].defaultAppConfig).toEqual({firstName: 'John'});
    });

    it('loads and registers a portal app v1', () => {

        const pluginPackage: any = {
            pluginPackagePath: '/foo/bar'
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: 'my description',
            tags: ['tag1', 'tag2'],
            type: 'portal-app',
            errorMessage: null,
            lastReloadTs: Date.now(),
            requireBootstrap: () => { /* nothing to do */ },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal App 1',
                type: 'portal-app',
                description: null,
                title: 'Portal App 1',
                category: 'Test',
                tags: ['tag1', 'tag2'],
                requires: null,
                bootstrap: 'startApp',
                resources: {
                    js: [
                        'bundle.js',
                    ],
                    css: [
                        'style.css'
                    ],
                },
                sharedResources: {
                    js: [
                        'globalLib.js'
                    ]
                },
                screenshots: [
                    'screenshot1.png'
                ],
                defaultConfig: {
                    resourcesRoot: './dist',
                    defaultRestrictViewToRoles: ['Role1'],
                    rolePermissions: {
                        doSomethingSpecial: ['Role2', 'Role3']
                    },
                    restProxies: {
                        'whatever': {
                            targetUri: 'https://whatever.com/api',
                            sendPermissionsHeader: false,
                            restrictToRoles: ['Role1']
                        }
                    },
                    metaInfo: {
                        capabilities: ['foo']
                    },
                    appConfig: {
                        firstName: 'John',
                    },
                },
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        if (process.platform !== 'win32') {
            expect(registry.portalApps[0].resourcesRootUri).toBe('file:///foo/bar/dist');
        }
        expect(registry.portalApps[0].description).toBe('my description');
        expect(registry.portalApps[0].title).toEqual('Portal App 1');
        expect(registry.portalApps[0].tags).toEqual(['tag1', 'tag2']);
        expect(registry.portalApps[0].category).toEqual('Test');
        expect(registry.portalApps[0].resources).toEqual({'js': ['bundle.js'], 'css': ['style.css']});
        expect(registry.portalApps[0].sharedResources).toEqual({'js': ['globalLib.js']});
        expect(registry.portalApps[0].clientBootstrap).toEqual('startApp');
        expect(registry.portalApps[0].screenshots).toEqual(['screenshot1.png']);
        expect(registry.portalApps[0].proxies).toBeTruthy();
        expect(registry.portalApps[0].metaInfo).toEqual({ capabilities: ['foo'] });
        expect(registry.portalApps[0].defaultAppConfig).toEqual({firstName: 'John'});
    });

});
