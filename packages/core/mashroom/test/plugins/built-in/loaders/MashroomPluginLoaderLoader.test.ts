
import {resolve} from 'path';
import {writeFileSync} from 'fs';
import {pathToFileURL} from 'url';
import {emptyDirSync} from 'fs-extra';
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomPluginLoaderLoader from '../../../../src/plugins/built-in/loaders/MashroomPluginLoaderLoader';
import MashroomPlugin from '../../../../src/plugins/MashroomPlugin';


const getPluginPackageFolder = () => {
    const packageFolder = resolve(__dirname, '../../../../test-data/loader2/test-package');
    emptyDirSync(packageFolder);
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
            pluginPackageURL: pathToFileURL(pluginPackagePath),
        };

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, loggingUtils.dummyLoggerFactory);

        writeFileSync(resolve(pluginPackagePath, pluginDefinition.bootstrap), `
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

        const loaderLoader = new MashroomPluginLoaderLoader(new PluginRegistryMock(), loggingUtils.dummyLoggerFactory);

        await loaderLoader.load(plugin, {}, new PluginContextHolderMock());

        expect(registeredPluginType).toBe('custom-plugin');
        expect(registeredPlugin).toBeTruthy();
        expect(registeredPlugin && registeredPlugin.name).toBe('the test loader');
        // @ts-ignore
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

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, loggingUtils.dummyLoggerFactory);

        const loader = new MashroomPluginLoaderLoader(new PluginRegistryMock(), loggingUtils.dummyLoggerFactory);
        const loadedPlugin: any = {};
        // @ts-ignore
        loader._loadedPlugins.set('custom-plugin', loadedPlugin);

        loader.unload(plugin);

        expect(unregisteredPluginType).toBe('custom-plugin');
        // @ts-ignore
        expect(loader._loadedPlugins.size).toBe(0);
    });

});
