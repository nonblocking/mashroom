
// @ts-ignore
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import PortalAppPluginLoader from '../../../../src/backend/plugins/loader/PortalAppPluginLoader';
import MashroomPortalPluginRegistry from '../../../../src/backend/plugins/MashroomPortalPluginRegistry';

import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';

describe('PortalAppPluginLoader', () => {

    it('loads and registers a portal app', () => {

        const pluginPackage: any = {};
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
                description: null,
                requires: null,
                type: 'portal-app',
                bootstrap: 'startApp',
                resources: {
                    js: [
                        'bundle.js',
                    ],
                    css: [],
                },
                defaultConfig: {
                    resourcesRoot: '/foo/bar',
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
        expect(registry.portalApps[0].resourcesRootUri).toBe('file:///foo/bar');
        expect(registry.portalApps[0].description).toBe('my description');
        expect(registry.portalApps[0].tags).toEqual(['tag1', 'tag2']);
        expect(registry.portalApps[0].resources).toEqual({'js': ['bundle.js'], 'css': []});
        expect(registry.portalApps[0].defaultAppConfig).toEqual({firstName: 'John'});
    });

    it('loads and registers a portal app with relative HTTP resource root', () => {

        const pluginPackage: any = {};
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: null,
            tags: [],
            type: 'portal-app',
            errorMessage: null,
            lastReloadTs: Date.now(),
            requireBootstrap: () => { /* nothing to do */ },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal App 1',
                description: null,
                requires: null,
                type: 'portal-app',
                bootstrap: 'startApp',
                resources: {
                    js: [
                        'bundle.js',
                    ],
                    css: [],
                },
                defaultConfig: {
                    resourcesRoot: 'http://www.test.com/foo/bar',
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
        expect(registry.portalApps[0].resourcesRootUri).toBe('http://www.test.com/foo/bar');
    });

    it('loads and registers a portal app with relative resource root', () => {

        const pluginPackage: any = {
            pluginPackagePath: '/opt/mashroom/packages/test',
        };
        const appPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App 1',
            description: null,
            tags: [],
            type: 'portal-app',
            errorMessage: null,
            lastReloadTs: Date.now(),
            requireBootstrap: () => { /* nothing to do */ },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal App 1',
                description: null,
                requires: null,
                type: 'portal-app',
                bootstrap: 'startApp',
                resources: {
                    js: [
                        'bundle.js',
                    ],
                    css: [],
                },
                defaultConfig: {
                    resourcesRoot: './public',
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
        if (process.platform === 'win32') {
            expect(registry.portalApps[0].resourcesRootUri).toBe('file:///C:\\opt\\mashroom\\packages\\test\\public');
        } else {
            expect(registry.portalApps[0].resourcesRootUri).toBe('file:///opt/mashroom/packages/test/public');
        }
    });
});
