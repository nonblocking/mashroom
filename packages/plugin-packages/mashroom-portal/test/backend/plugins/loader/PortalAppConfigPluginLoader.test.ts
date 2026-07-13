
import {pathToFileURL} from 'url';
import {loggingUtils} from '@mashroom/mashroom-utils';
import PortalAppConfigPluginLoader from '../../../../src/backend/plugins/loader/PortalAppConfigPluginLoader';
import MashroomPortalPluginRegistry from '../../../../src/backend/plugins/MashroomPortalPluginRegistry';

import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';

describe('PortalAppConfigPluginLoader', () => {

    it('loads and registers an Portal App config plugin', async () => {
        const pluginPackage: any = {
            pluginPackageUrl: pathToFileURL('/opt/mashroom/packages/test'),
        };

        const pageEnhancementPlugin: MashroomPlugin = {
            pluginPackage,
            name: 'Portal App Config 1',
            description: null,
            tags: [],
            type: 'portal-app-config',
            errorMessage: null,
            lastReloadTs: Date.now(),
            loadBootstrap: async () => {
                return () => ({});
            },
            requireBootstrap: () => { throw new Error('not implemented'); },
            status: 'loaded',
            config: null,
            pluginDefinition: {
                name: 'Portal App Config 1',
                type: 'portal-app-config',
                bootstrap: './dist/mashroom-bootstrap.js',
                defaultConfig: {
                }
            },
        };

        const registry = new MashroomPortalPluginRegistry();
        const loader = new PortalAppConfigPluginLoader(registry, loggingUtils.dummyLoggerFactory);

        const context: any = {};
        await loader.load(pageEnhancementPlugin, {}, context);

        expect(registry.portalAppConfigs.length).toBe(1);
        expect(registry.portalAppConfigs[0].name).toBe('Portal App Config 1');
    });

});
