// @flow

import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomPluginLoaderLoader from '../../../src/plugins/loader/MashroomPluginLoaderLoader';
import MashroomPlugin from '../../../src/plugins/MashroomPlugin';

const getPluginPackageFolder = () => {
    const packageFolder = path.resolve(__dirname, '../../../test-data/loader2/test-package');
    fsExtra.emptyDirSync(packageFolder);
    return packageFolder;
};

const registerPluginLoaderMock = jest.fn();
const unregisterPluginLoaderMock = jest.fn();
const PluginRegistryMock: any = jest.fn(() => ({
    plugins: [{
        name: 'Existing plugin',
        type: 'custom-plugin',
        pluginDefinition: {
            defaultConfig: {
                foo: '1',
            },
        },
    }],
    pluginLoaders: {},
    registerPluginLoader: registerPluginLoaderMock,
    unregisterPluginLoader: unregisterPluginLoaderMock,
}));

const RegistryConnectorMock: any = jest.fn(() => ({
    on: () => {},
}));

describe('MashroomPluginLoaderLoader', () => {

    beforeEach(() => {
        registerPluginLoaderMock.mockReset();
        unregisterPluginLoaderMock.mockReset();
    });

    it('loads a loader plugin', async () => {
        const pluginPackagePath = getPluginPackageFolder();
        let registeredPluginType = null;
        let registeredPlugin: any = null;

        registerPluginLoaderMock.mockImplementation((pluginType, plugin) => {
            registeredPluginType = pluginType;
            registeredPlugin = plugin;
        });

        const pluginDefinition: any = {
            bootstrap: 'bootstrap.js',
            name: 'TestLoader1',
            type: 'plugin-loader',
            loads: 'custom-plugin',
        };

        const pluginPackage: any = {
            pluginPackagePath,
        };

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), dummyLoggerFactory);

        fs.writeFileSync(path.resolve(pluginPackagePath, pluginDefinition.bootstrap), `
            let loadCalled = false;
            module.exports = () => ({ name: 'the test loader', generateMinimumConfig: () => {}, load: (plugin, config) => { console.info('Loading: ', plugin, config); loadCalled = true }, loadCalled: () => loadCalled });
        `);

        const context: any = {
            serverConfig: {
                plugins: [],
            },
        };

        const PluginContextHolderMock: any = jest.fn(() => ({
            getPluginContext: () => context
        }));

        const loaderLoader = new MashroomPluginLoaderLoader(new PluginRegistryMock(), dummyLoggerFactory);

        await loaderLoader.load(plugin, {}, new PluginContextHolderMock());

        expect(registeredPluginType).toBe('custom-plugin');
        expect(registeredPlugin).toBeTruthy();
        expect(registeredPlugin && registeredPlugin.name).toBe('the test loader');
        expect(loaderLoader._loadedPlugins.size).toBe(1);
    });

    it('unloads a loader plugin', () => {

        let unregisteredPluginType = null;

        unregisterPluginLoaderMock.mockImplementation((pluginType) => {
            unregisteredPluginType = pluginType;
        });

        const pluginDefinition: any = {
            bootstrap: 'bootstrap.js',
            name: 'TestLoader1',
            type: 'plugin-loader',
            loads: 'custom-plugin',
        };

        const pluginPackage: any = {};

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), dummyLoggerFactory);

        const loader = new MashroomPluginLoaderLoader(new PluginRegistryMock(), dummyLoggerFactory);
        const loadedPlugin: any = {};
        loader._loadedPlugins.set('custom-plugin', loadedPlugin);

        loader.unload(plugin);

        expect(unregisteredPluginType).toBe('custom-plugin');
        expect(loader._loadedPlugins.size).toBe(0);
    });

});
