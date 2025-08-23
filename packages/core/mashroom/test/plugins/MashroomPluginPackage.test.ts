
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomPluginPackage from '../../src/plugins/MashroomPluginPackage';
import type {MashroomPluginPackageDefinition, MashroomPluginPackageMeta} from '../../type-definitions';

describe('MashroomPluginPackage', () => {

    it('processes the plugin definition correctly', () => {
        const packageMeta: MashroomPluginPackageMeta = {
            name: '@mashroom/test-plugin',
            description: 'this is the description',
            version: '1.1.1',
            homepage: null,
            author: null,
            license: 'Apache-2.0',
        };
        const packageDefinition: MashroomPluginPackageDefinition = {
            devModeBuildScript: 'build',
            plugins: []
        };

        const pluginPackage = new MashroomPluginPackage(
            new URL('file:///test'), packageDefinition, packageMeta);

        expect(pluginPackage.name).toBe('@mashroom/test-plugin');
        expect(pluginPackage.description).toBe('this is the description');
        expect(pluginPackage.version).toBe('1.1.1');
        expect(pluginPackage.status).toBe('pending');
    });
});
