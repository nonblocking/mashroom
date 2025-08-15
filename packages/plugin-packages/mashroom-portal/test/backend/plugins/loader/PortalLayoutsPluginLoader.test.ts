
import {parse} from 'path';
import {pathToFileURL} from 'url';
import {loggingUtils} from '@mashroom/mashroom-utils';
import PortalLayoutsPluginLoader from '../../../../src/backend/plugins/loader/PortalLayoutsPluginLoader';
import MashroomPortalPluginRegistry from '../../../../src/backend/plugins/MashroomPortalPluginRegistry';

import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';

describe('PortalLayoutsPluginLoader', () => {

    it('loads and registers layouts', async () => {
        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/opt/mashroom/packages/test'),
        };
        const layoutsPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal Layouts 1',
            description: null,
            tags: [],
            type: 'portal-layouts',
            errorMessage: null,
            lastReloadTs: Date.now(),
            requireBootstrap: () => { /* nothing to do */ },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal Layouts 1',
                description: null,
                requires: null,
                type: 'portal-layouts',
                bootstrap: null,
                layouts: {
                    '2_columns_50_50': './layouts/2_columns_50_50.html',
                    '2_columns_70_30': './layouts/2_columns_70_30.html',
                },
                defaultConfig: null,
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalLayoutsPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(layoutsPlugin, {}, context);

        expect(registry.layouts.length).toBe(2);
        expect(registry.layouts[0].layoutId).toBe('2_columns_50_50');
        expect(registry.layouts[1].layoutId).toBe('2_columns_70_30');
        // @ts-ignore
        expect(loader._loadedLayouts.get('Portal Layouts 1')).toEqual({
            'Portal Layouts 1 2_columns_50_50': true,
            'Portal Layouts 1 2_columns_70_30': true,
        });

        if (process.platform === 'win32') {
            const {root} = parse(__dirname);
            expect(registry.layouts[0].layoutPath).toBe(`${root}opt\\mashroom\\packages\\test\\layouts\\2_columns_50_50.html`);
            expect(registry.layouts[1].layoutPath).toBe(`${root}opt\\mashroom\\packages\\test\\layouts\\2_columns_70_30.html`);
        } else {
            expect(registry.layouts[0].layoutPath).toBe('/opt/mashroom/packages/test/layouts/2_columns_50_50.html');
            expect(registry.layouts[1].layoutPath).toBe('/opt/mashroom/packages/test/layouts/2_columns_70_30.html');
        }
    });

    it('unregisters all layouts of a plugin', async () => {
        const pluginPackage: any = {
            pluginPackageURL: pathToFileURL('/opt/mashroom/packages/test'),
        };
        const layoutsPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal Layouts 1',
            description: null,
            tags: [],
            type: 'portal-layouts',
            errorMessage: null,
            lastReloadTs: Date.now(),
            requireBootstrap: () => { /* nothing to do */ },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal Layouts 1',
                description: null,
                requires: null,
                type: 'portal-layouts',
                bootstrap: null,
                layouts: {
                    '2_columns_50_50': './layouts/2_columns_50_50.html',
                    '2_columns_70_30': './layouts/2_columns_70_30.html',
                },
                defaultConfig: null,
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalLayoutsPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(layoutsPlugin, {}, context);
        await loader.unload(layoutsPlugin);

        expect(registry.layouts.length).toBe(0);
    });

    it('loads and registers layouts from a remote location', async () => {
        const pluginPackage: any = {
            pluginPackageURL: new URL('https://my.server/foo'),
        };
        const layoutsPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal Layouts 1',
            description: null,
            tags: [],
            type: 'portal-layouts',
            errorMessage: null,
            lastReloadTs: Date.now(),
            requireBootstrap: () => { /* nothing to do */ },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal Layouts 1',
                description: null,
                requires: null,
                type: 'portal-layouts',
                bootstrap: null,
                layouts: {
                    '2_columns_50_50': './layouts/2_columns_50_50.html',
                    '2_columns_70_30': './layouts/2_columns_70_30.html',
                },
                defaultConfig: null,
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalLayoutsPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(layoutsPlugin, {}, context);

        expect(registry.layouts.length).toBe(2);
        expect(registry.layouts[0].layoutId).toBe('2_columns_50_50');
        expect(registry.layouts[1].layoutId).toBe('2_columns_70_30');
        // @ts-ignore
        expect(loader._loadedLayouts.get('Portal Layouts 1')).toEqual({
            'Portal Layouts 1 2_columns_50_50': true,
            'Portal Layouts 1 2_columns_70_30': true,
        });

        expect(registry.layouts[0].layoutPath).toBe('https://my.server/foo/layouts/2_columns_50_50.html');
        expect(registry.layouts[1].layoutPath).toBe('https://my.server/foo/layouts/2_columns_70_30.html');
    });

});
