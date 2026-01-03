
import {pathToFileURL} from 'url';
import {loggingUtils} from '@mashroom/mashroom-utils';
import PortalAppEnhancementPluginLoader from '../../../../src/backend/plugins/loader/PortalAppEnhancementPluginLoader';
import MashroomPortalPluginRegistry from '../../../../src/backend/plugins/MashroomPortalPluginRegistry';

import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';

describe('PortalAppEnhancementPluginLoader', () => {

    it('loads and registers app enhancements', async () => {
        const pluginPackage: any = {
            pluginPackageUrl: pathToFileURL('/opt/mashroom/packages/test'),
        };

        const pageEnhancementPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App Enhancement 1',
            description: null,
            tags: [],
            type: 'portal-app-enhancement',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => {
                return () => ({});
            },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal App Enhancement 1',
                type: 'portal-app-enhancement',
                bootstrap: './dist/mashroom-bootstrap.js',
                defaultConfig: {
                }
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppEnhancementPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(pageEnhancementPlugin, {}, context);

        expect(registry.portalAppEnhancements.length).toBe(1);
        expect(registry.portalAppEnhancements[0].name).toBe('Portal App Enhancement 1');
    });

});
