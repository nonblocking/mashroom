import {pathToFileURL} from 'url';
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomPluginManager from '../../src/plugins/MashroomPluginManager';
import type {MashroomPluginScannerCallback} from '../../type-definitions';

const testPackageJson1 = {
    name: 'test1',
    description: 'description test3',
    version: '1.1.3',
    license: 'BSD-3-Clause',
    author: 'Jürgen Kofler <juergen.kofler@nonblocking.at>',
    mashroom: {
        devModeBuildScript: 'builddd',
        plugins: [
            {
                name: 'Plugin 1',
                type: 'web-app',
                bootstrap: './dist/mashroom-bootstrap.js',
                defaultConfig: {
                    foo: 'bar',
                },
            },
            {
                name: 'Plugin 2',
                type: 'plugin-loader',
                bootstrap: './dist/mashroom-bootstrap2.js',
                dependencies: ['foo-services'],
            },
            {
                name: 'Plugin 3',
                type: 'foo',
                bootstrap: 'foo',
            },
            {
                name: 'Plugin 4',
                description: 'Invalid - should be ignored',
            },
            {
                name: 'Plugin 5/6',
                description: 'Invalid - should be ignored',
                type: 'plugin-loader',
                bootstrap: './dist/mashroom-bootstrap2.js',
            },
            {
                description: 'Invalid - should be ignored',
            },
        ],
    },
};

const testPackageJson2 = {
    name: 'test2',
    version: '1.1.3',
    mashroom: {
        plugins: [
            {
                name: 'Plugin 1',
                type: 'web-app',
                bootstrap: './dist/mashroom-bootstrap.js',
                defaultConfig: {
                    foo: 'bar',
                },
            },
            {
                name: 'Plugin 2',
                type: 'foo',
                bootstrap: './dist/mashroom-bootstrap2.js'
            },
        ],
    },
};

const testPackageJson3 = {
    name: 'test3',
    version: '1.1.3',
    mashroom: {
        plugins: [
            {
                name: 'Plugin 3',
                type: 'web-app',
                bootstrap: './dist/mashroom-bootstrap.js',
                requires: ['Plugin 2']
            },
        ],
    },
};

const testPackageJson4 = {
    name: 'test4',
    version: '1.1.3',
    mashroom: {
        plugins: [
            {
                name: 'Plugin 8',
                type: 'web-app',
                bootstrap: './dist/mashroom-bootstrap.js'
            },
        ],
    },
};

const testPackageJson5 = {
    name: 'test5',
    version: '1.1.3',
    mashroom: {
        plugins: [
            {
                name: 'Plugin 8',
                type: 'web-app2',
                bootstrap: './dist/mashroom-bootstrap.js'
            },
        ],
    },
};

const testPackageJsonDefinitionBuilder1 = {
    buildDefinition: async (url: URL) => {
        return {
            definition: testPackageJson1.mashroom as any,
            meta: testPackageJson1 as any,
        };
    }
};

const testPackageJsonDefinitionBuilder2 = {
    buildDefinition: async (url: URL) => {
        if (url.toString().includes('test2')) {
            return {
                definition: testPackageJson2.mashroom as any,
                meta: testPackageJson2 as any,
            };
        }
        if (url.toString().includes('test3')) {
            return {
                definition: testPackageJson3.mashroom as any,
                meta: testPackageJson3 as any,
            };
        }
        return null;
    }
};

let testPackageJsonDefinitionBuilder3Calls = 0;
const testPackageJsonDefinitionBuilder3 = {
    buildDefinition: async (url: URL) => {
        if (testPackageJsonDefinitionBuilder3Calls === 0) {
            testPackageJsonDefinitionBuilder3Calls ++ ;
            return {
                definition: testPackageJson4.mashroom as any,
                meta: testPackageJson4 as any,
            };
        }
        return {
            definition: testPackageJson5.mashroom as any,
            meta: testPackageJson5 as any,
        };
    }
};

const builderOnMock = jest.fn();
const builderRemoveListenerMock = jest.fn();
const builderAddToBuildQueueMock = jest.fn();
const BuilderMock: any = jest.fn(() => ({
    on: builderOnMock,
    removeListener: builderRemoveListenerMock,
    addToBuildQueue: builderAddToBuildQueueMock,
}));

const mockPluginContext: any = {
    serverConfig: {

    }
};
const mockPluginContextHolder = {
    getPluginContext: () => mockPluginContext,
};

let scannerCallback: MashroomPluginScannerCallback | undefined;
const mockScanner = {
    setCallback: (callback: MashroomPluginScannerCallback) => {
        scannerCallback = callback;
    },
    start: () => {},
    stop: () => {},
};

const mockPluginLoad = jest.fn();
const mockPluginUnload = jest.fn();
const mockPluginLoader: any = {
    generateMinimumConfig: () => ({}),
    load: mockPluginLoad,
    unload: mockPluginUnload,
};

describe('MashroomPluginManager', () => {

    beforeEach(() => {
        builderOnMock.mockReset();
        builderRemoveListenerMock.mockReset();
        builderAddToBuildQueueMock.mockReset();
        mockPluginLoad.mockReset();
        mockPluginUnload.mockReset();
        scannerCallback = undefined;
        testPackageJsonDefinitionBuilder3Calls = 0;
    });

    it('reads a new package builds it and loads the plugins', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);
        let buildFinishedCallback: any = null;

        builderOnMock.mockImplementation((event, callback) => {
            if (event === 'build-finished') {
                buildFinishedCallback = callback;
            }
        });

        builderAddToBuildQueueMock.mockImplementation((pluginPackageName, _pluginPackagePath, buildScript) => {
            expect(pluginPackageName).toBe('test1');
            expect(_pluginPackagePath).toBe(pluginPackagePath);
            expect(buildScript).toBe('builddd');
            setTimeout(() => {
                if (buildFinishedCallback) {
                    // Other build
                    buildFinishedCallback({
                        pluginPackagePath: 'foooo',
                        success: false,
                    });
                    buildFinishedCallback({
                        pluginPackagePath,
                        success: true,
                    });
                }
            }, 200);
        });

        const pluginManager = new MashroomPluginManager([], new BuilderMock(), mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();
        expect(buildFinishedCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        const pluginPackages = pluginManager.pluginPackages;
        expect(pluginPackages.length).toBe(1);
        expect(pluginPackages[0].name).toBe('test1');
        expect(pluginPackages[0].description).toBe('description test3');
        expect(pluginPackages[0].version).toBe('1.1.3');
        expect(pluginPackages[0].license).toBe('BSD-3-Clause');
        expect(pluginPackages[0].author).toBe('Jürgen Kofler <juergen.kofler@nonblocking.at>');
        expect(pluginPackages[0].status).toBe('ready');

        const plugins = pluginManager.plugins;
        expect(plugins.length).toBe(3);

        expect(plugins[0].name).toBe('Plugin 1');
        expect(plugins[0].type).toBe('web-app');
        expect(plugins[0].status).toBe('loaded');

        expect(plugins[1].name).toBe('Plugin 2');
        expect(plugins[1].type).toBe('plugin-loader');
        expect(plugins[1].status).toBe('error');
        expect(plugins[1].errorMessage).toBe('No loader found for type: plugin-loader');

        expect(plugins[2].name).toBe('Plugin 3');
        expect(plugins[2].type).toBe('foo');
        expect(plugins[2].status).toBe('error');
        expect(plugins[2].errorMessage).toBe('No loader found for type: foo');

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(0);
    });

    it('does not load any plugins if a package build error occurs', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);
        let buildFinishedCallback: any = null;

        builderOnMock.mockImplementation((event, callback) => {
            if (event === 'build-finished') {
                buildFinishedCallback = callback;
            }
        });

        builderAddToBuildQueueMock.mockImplementation((pluginPackageName, _pluginPackagePath, buildScript) => {
            setTimeout(() => {
                if (buildFinishedCallback) {
                    buildFinishedCallback({
                        pluginPackagePath,
                        success: false,
                        errorMessage: 'build errror!',
                    });
                }
            }, 200);
        });

        const pluginManager = new MashroomPluginManager([], new BuilderMock(), mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();
        expect(buildFinishedCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        const pluginPackages = pluginManager.pluginPackages;
        expect(pluginPackages[0].status).toBe('error');
        expect(pluginPackages[0].errorMessage).toBe('build errror!');

        const plugins = pluginManager.plugins;
        expect(plugins.length).toBe(0);
    });

    it('respects the plugin ignore list', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(['Plugin 1'], null, mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        const pluginPackages = pluginManager.pluginPackages;
        expect(pluginPackages.length).toBe(1);
        expect(pluginPackages[0].name).toBe('test1');
        expect(pluginPackages[0].description).toBe('description test3');
        expect(pluginPackages[0].version).toBe('1.1.3');
        expect(pluginPackages[0].license).toBe('BSD-3-Clause');
        expect(pluginPackages[0].author).toBe('Jürgen Kofler <juergen.kofler@nonblocking.at>');
        expect(pluginPackages[0].status).toBe('ready');

        const plugins = pluginManager.plugins;
        expect(plugins.length).toBe(2);
        expect(plugins[0].name).toBe('Plugin 2');
        expect(plugins[1].name).toBe('Plugin 3');
    });

    it('respects the build definition builder weight', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager([], null, mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(10, /* dummy */ {} as any);
        pluginManager.registerPluginDefinitionBuilder(11, testPackageJsonDefinitionBuilder1);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);
    });

    it('reloads plugins if the package gets updated', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager([], null, mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(10, /* dummy */ {} as any);
        pluginManager.registerPluginDefinitionBuilder(11, testPackageJsonDefinitionBuilder1);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);

        expect(mockPluginLoad).toHaveBeenCalledTimes(2);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('reloads plugins if the loader gets updated', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager([], null, mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(10, /* dummy */ {} as any);
        pluginManager.registerPluginDefinitionBuilder(11, testPackageJsonDefinitionBuilder1);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update the loader
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);

        expect(mockPluginLoad).toHaveBeenCalledTimes(2);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('plugins are unloaded if package is removed', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager([], null, mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(10, /* dummy */ {} as any);
        pluginManager.registerPluginDefinitionBuilder(11, testPackageJsonDefinitionBuilder1);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Remove the package
        scannerCallback!.removePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(0);
        expect(pluginManager.plugins.length).toBe(0);

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('plugins are unloaded if package definition is removed', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager([], null, mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Remove the definition builder and update
        pluginManager.unregisterPluginDefinitionBuilder(testPackageJsonDefinitionBuilder1);
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackageURLs.length).toBe(1);
        expect(pluginManager.pluginPackages.length).toBe(0);
        expect(pluginManager.plugins.length).toBe(0);

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('it loads pending plugins if the correct load is registered and re-evaluates all plugins with missing requirements', async () => {
        const pluginPackage2URL = pathToFileURL('/foo/test2');
        const pluginPackage3URL = pathToFileURL('/foo/test3');

        const pluginManager = new MashroomPluginManager([], null, mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder2);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackage2URL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        const pluginPackages = pluginManager.pluginPackages;
        expect(pluginPackages.length).toBe(1);

        const plugins = pluginManager.plugins;
        expect(plugins.length).toBe(2);
        expect(plugins[0].name).toBe('Plugin 1');
        expect(plugins[0].status).toBe('loaded');
        expect(plugins[1].name).toBe('Plugin 2');
        expect(plugins[1].status).toBe('error');
        expect(plugins[1].errorMessage).toBe('No loader found for type: foo');

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);

        // Add a second package
        scannerCallback!.addOrUpdatePackageURL(pluginPackage3URL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        const plugins2 = pluginManager.plugins;
        expect(plugins2.length).toBe(3);
        expect(plugins2[0].name).toBe('Plugin 1');
        expect(plugins2[0].status).toBe('loaded');
        expect(plugins2[1].name).toBe('Plugin 2');
        expect(plugins2[1].status).toBe('error');
        expect(plugins2[1].errorMessage).toBe('No loader found for type: foo');
        expect(plugins2[2].name).toBe('Plugin 3');
        expect(plugins2[2].status).toBe('error');
        expect(plugins2[2].errorMessage).toBe('Missing required plugins: Plugin 2');

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);

        // Now, add the missing loader for Plugin 2
        pluginManager.registerPluginLoader('foo', mockPluginLoader);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        const plugins3 = pluginManager.plugins;
        expect(plugins3.length).toBe(3);
        expect(plugins3[0].name).toBe('Plugin 1');
        expect(plugins3[0].status).toBe('loaded');
        expect(plugins3[1].name).toBe('Plugin 2');
        expect(plugins3[1].status).toBe('loaded');
        expect(plugins3[2].name).toBe('Plugin 3');
        expect(plugins3[2].status).toBe('loaded');

        expect(mockPluginLoad).toHaveBeenCalledTimes(3);
        expect(mockPluginUnload).toHaveBeenCalledTimes(0);
    });

    it('handles package updates where the plugin type changes', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager([], null, mockPluginContextHolder, loggingUtils.dummyLoggerFactory);

        // Add loaders
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginLoader('web-app2', mockPluginLoader);

        // Add definition builders
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder3);

        // Add scanner
        pluginManager.registerPluginScanner('Scanner 1', mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        const plugins = pluginManager.plugins;
        expect(plugins.length).toBe(1);
        expect(plugins[0].name).toBe('Plugin 8');
        expect(plugins[0].type).toBe('web-app');

        // Update
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Wait
        await new Promise((resolve) => setTimeout(resolve, 500));

        const plugins2 = pluginManager.plugins;
        expect(plugins2.length).toBe(1);
        expect(plugins2[0].name).toBe('Plugin 8');
        expect(plugins2[0].type).toBe('web-app2');

        expect(mockPluginLoad).toHaveBeenCalledTimes(2);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });
});
