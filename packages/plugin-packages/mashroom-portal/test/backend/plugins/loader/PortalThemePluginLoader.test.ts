
import {parse} from 'path';
import {pathToFileURL} from 'url';
import {loggingUtils} from '@mashroom/mashroom-utils';
import PortalThemePluginLoader from '../../../../src/backend/plugins/loader/PortalThemePluginLoader';
import MashroomPortalPluginRegistry from '../../../../src/backend/plugins/MashroomPortalPluginRegistry';

import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';

describe('PortalThemePluginLoader', () => {

    it('loads and registers a theme', async () => {

        const pluginPackage: any = {
            pluginPackageUrl: pathToFileURL('/opt/mashroom/packages/test'),
        };

        const themePlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal Theme 1',
            description: null,
            tags: [],
            type: 'portal-theme',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => () => ({
                engineName: 'test',
                engineFactory: () => { /* nothing to do */ },
            }),
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal Theme 1',
                description: null,
                requires: null,
                type: 'portal-app',
                bootstrap: 'bootstrap.js',
                views: './public/views',
                defaultConfig: null,
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalThemePluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(themePlugin, {}, context);

        expect(registry.themes.length).toBe(1);
        expect(registry.themes[0].engineName).toBe('test');
        expect(registry.themes[0].requireEngine).toBeTruthy();
        if (process.platform === 'win32') {
            const {root} = parse(__dirname);
            expect(registry.themes[0].viewsPath).toBe(`${root}opt\\mashroom\\packages\\test\\public\\views`);
        } else {
            expect(registry.themes[0].viewsPath).toBe('/opt/mashroom/packages/test/public/views');
        }
    });
});
