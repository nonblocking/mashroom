import {pathToFileURL} from 'url';
import {loggingUtils} from '@mashroom/mashroom-utils';
import PortalAppPluginLoader from '../../../../src/backend/plugins/loader/PortalAppPluginLoader';
import MashroomPortalPluginRegistry from '../../../../src/backend/plugins/MashroomPortalPluginRegistry';

import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';
import type {MashroomPlugins} from '@mashroom/mashroom-json-schemas/type-definitions';

describe('PortalAppPluginLoader', () => {

    it('loads and registers a Portal App v2', async () => {
        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/foo/bar'),
        };
        const pluginDefinition: MashroomPlugins['plugins'][0] = {
            name: 'Portal App 1',
            type: 'portal-app2',
            requires: undefined,
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
                title: {
                    en: 'Portal App 1',
                    de: 'Portal App 1',
                },
                category: 'Test',
                tags: ['tag1', 'tag2'],
                description: {
                    en: 'my description',
                    de: 'my description',
                },
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
                    whatever: {
                        targetUri: 'https://whatever.com/api',
                        sendPermissionsHeader: false,
                        restrictToRoles: ['Role1']
                    }
                },
                appConfig: {
                    firstName: 'John',
                },
            },
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: 'description from package',
            tags: ['tag1', 'tag2'],
            type: 'portal-app2',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition,
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        await loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        if (process.platform !== 'win32') {
            expect(registry.portalApps[0].resourcesRootUri).toBe('file:///foo/bar/dist');
        }
        expect(registry.portalApps[0].description).toEqual({
            en: 'my description',
            de: 'my description',
        });
        expect(registry.portalApps[0].title).toEqual({
            en: 'Portal App 1',
            de: 'Portal App 1',
        });
        expect(registry.portalApps[0].tags).toEqual(['tag1', 'tag2']);
        expect(registry.portalApps[0].category).toEqual('Test');
        expect(registry.portalApps[0].resources).toEqual({moduleSystem: 'none', js: ['bundle.js'], css: ['style.css']});
        expect(registry.portalApps[0].sharedResources).toEqual({js: ['globalLib.js']});
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

    it('loads and registers a minimal Portal App v2', async () => {
        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/foo/bar'),
        };
        const pluginDefinition: MashroomPlugins['plugins'][0] = {
            name: 'Portal App 1',
            type: 'portal-app2',
            clientBootstrap: 'startApp',
            resources: {
                js: [
                    'bundle.js',
                ],
            },
            defaultConfig: {
            },
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: undefined,
            tags: [],
            type: 'portal-app2',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition,
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        await loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        if (process.platform !== 'win32') {
            expect(registry.portalApps[0].resourcesRootUri).toBe('file:///foo/bar/dist');
        }
        expect(registry.portalApps[0].resources).toEqual({moduleSystem: 'none', js: ['bundle.js']});
        expect(registry.portalApps[0].clientBootstrap).toEqual('startApp');
        expect(registry.portalApps[0].ssrBootstrap).toBeFalsy();
        expect(registry.portalApps[0].defaultAppConfig).toEqual({});
    });

    it('loads and registers a Portal App v2 with a BFF proxy', async () => {
        const pluginPackage: any = {
            pluginPackageURL: 'http://my-microfrontend.my-company.com', // A BFF makes only sense for a remote plugin
        };
        const pluginDefinition: MashroomPlugins['plugins'][0] = {
            name: 'Portal App 1',
            type: 'portal-app2',
            clientBootstrap: 'startApp',
            resources: {
                js: [
                    'bundle.js',
                ],
            },
            remote: {
               resourcesRoot: '/'
            },
            defaultConfig: {
                proxies: {
                    myBff: {
                        targetPath: '/api',
                    },
                }
            },
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: undefined,
            tags: [],
            type: 'portal-app2',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition,
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        await loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        expect(registry.portalApps[0].proxies).toEqual({
            myBff: {
                targetUri: 'http://my-microfrontend.my-company.com/api'
            }
        });
    });

    it('loads and registers a Portal App v2 with an import map', async () => {
        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/foo/bar'),
        };
        const pluginDefinition: MashroomPlugins['plugins'][0] = {
            name: 'Portal App 1',
            type: 'portal-app2',
            clientBootstrap: 'startApp',
            resources: {
                moduleSystem: 'SystemJS',
                importMap: {
                    imports: {
                        foo: 'http://foo.com/foo.js',
                    }
                },
                js: [
                    'bundle.js',
                ],
            },
            local: {
                resourcesRoot: './dist',
            },
            defaultConfig: {
            },
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: undefined,
            tags: [],
            type: 'portal-app2',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition,
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        await loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        expect(registry.portalApps[0].resources).toEqual({
            moduleSystem: 'SystemJS',
            importMap: {
                imports: {
                    foo: 'http://foo.com/foo.js'
                }
            },
            js: [
                'bundle.js'
            ],
        });
    });

    it('auto-detects the moduleSystem if the js resource extension is mjs', async () => {
        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/foo/bar'),
        };
        const pluginDefinition: MashroomPlugins['plugins'][0] = {
            name: 'Portal App 1',
            type: 'portal-app2',
            clientBootstrap: 'startApp',
            resources: {
                js: [
                    'bundle.mjs',
                ],
            },
            local: {
                resourcesRoot: './dist',
            },
            defaultConfig: {
            },
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: undefined,
            tags: [],
            type: 'portal-app2',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition,
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        await loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        expect(registry.portalApps[0].resources).toEqual({
            moduleSystem: 'ESM',
            js: [
                'bundle.mjs'
            ],
        });
    });

    it('processed remote Portal Apps in the root path', async () => {
        const pluginPackage: any = {
            pluginPackageURL: new URL('https://my-microfrontend.com'),
        };
        const pluginDefinition: MashroomPlugins['plugins'][0] = {
            name: 'Portal App 1',
            type: 'portal-app2',
            clientBootstrap: 'startApp',
            resources: {
                js: [
                    'bundle.js',
                ]
            },
            local: {
                resourcesRoot: './dist',
                ssrBootstrap: './dist/renderToString.js'
            },
            remote: {
                resourcesRoot: '/public',
            },
            defaultConfig: {
                appConfig: {
                    firstName: 'John',
                },
            },
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: 'description from package',
            tags: ['tag1', 'tag2'],
            type: 'portal-app2',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition,
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        await loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        expect(registry.portalApps[0].resourcesRootUri).toBe('https://my-microfrontend.com/public');
        expect(registry.portalApps[0].clientBootstrap).toEqual('startApp');
        expect(registry.portalApps[0].defaultAppConfig).toEqual({firstName: 'John'});
    });

    // Only for backward compatibility
    it('loads and registers a Portal App v1', async () => {
        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/foo/bar'),
        };
        const pluginDefinition = {
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
                    whatever: {
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
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: 'my description',
            tags: ['tag1', 'tag2'],
            type: 'portal-app',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => { throw new Error('not implemented'); },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition,
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        const config = {
            ...appPlugin.pluginDefinition.defaultConfig
        };
        await loader.load(appPlugin, config, context);

        expect(registry.portalApps.length).toBe(1);
        if (process.platform !== 'win32') {
            expect(registry.portalApps[0].resourcesRootUri).toBe('file:///foo/bar/dist');
        }
        expect(registry.portalApps[0].description).toBe('my description');
        expect(registry.portalApps[0].title).toEqual('Portal App 1');
        expect(registry.portalApps[0].tags).toEqual(['tag1', 'tag2']);
        expect(registry.portalApps[0].category).toEqual('Test');
        expect(registry.portalApps[0].resources).toEqual({moduleSystem: 'none', js: ['bundle.js'], css: ['style.css']});
        expect(registry.portalApps[0].sharedResources).toEqual({js: ['globalLib.js']});
        expect(registry.portalApps[0].clientBootstrap).toEqual('startApp');
        expect(registry.portalApps[0].screenshots).toEqual(['screenshot1.png']);
        expect(registry.portalApps[0].proxies).toBeTruthy();
        expect(registry.portalApps[0].metaInfo).toEqual({ capabilities: ['foo'] });
        expect(registry.portalApps[0].defaultAppConfig).toEqual({firstName: 'John'});
    });
});
