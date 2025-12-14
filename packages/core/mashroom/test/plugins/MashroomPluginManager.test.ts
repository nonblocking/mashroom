import {resolve} from 'path';
import {pathToFileURL, URL} from 'url';
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
                bootstrap: './dist/mashroom-bootstrap1.js',
                defaultConfig: {
                    foo: 'bar',
                },
            },
            {
                name: 'Plugin 2',
                type: 'plugin-loader',
                bootstrap: './dist/mashroom-bootstrap22.js',
                dependencies: ['foo-services'],
            },
            {
                name: 'Plugin 3',
                type: 'foo',
                bootstrap: 'foo',
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
                bootstrap: './dist/mashroom-bootstrap1.js',
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

const testPackageJson6 = {
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
                description: 'Invalid',
            },
            {
                name: 'Plugin 5/6',
                description: 'Invalid',
                type: 'plugin-loader',
                bootstrap: './dist/mashroom-bootstrap2.js',
            },
            {
                description: 'Invalid',
            },
        ],
    },
};

const testPackageJsonDefinitionBuilder1 = {
    name: 'Definition Builder 1',
    buildDefinition: async (packageURL: URL) => {
        return [{
            packageURL,
            definition: testPackageJson1.mashroom as any,
            meta: testPackageJson1 as any,
        }];
    }
};

const testPackageJsonDefinitionBuilder1FirstPluginRemoved = {
    name: 'Definition Builder 1',
    buildDefinition: async (packageURL: URL) => {
        return [{
            packageURL,
            definition: {
                plugins: [
                    testPackageJson1.mashroom.plugins[1],
                    testPackageJson1.mashroom.plugins[2],
                ],
            },
            meta: testPackageJson1 as any,
        }];
    }
};

const testPackageJsonDefinitionBuilder1WithPluginAdded = {
    name: 'Definition Builder 1',
    buildDefinition: async (packageURL: URL) => {
        return [{
            packageURL,
            definition: {
                plugins: [
                    ...testPackageJson1.mashroom.plugins,
                    {
                        name: 'Plugin 1111',
                        type: 'web-app',
                        bootstrap: './dist/mashroom-bootstrap1111.js',
                        defaultConfig: {
                        },
                    },
                ],
            },
            meta: testPackageJson1 as any,
        }];
    }
};

const testPackageJsonDefinitionBuilder2 = {
    name: 'Definition Builder 2',
    buildDefinition: async (packageURL: URL) => {
        if (packageURL.toString().includes('test2')) {
            return [{
                packageURL,
                definition: testPackageJson2.mashroom as any,
                meta: testPackageJson2 as any,
            }];
        }
        if (packageURL.toString().includes('test3')) {
            return [{
                packageURL,
                definition: testPackageJson3.mashroom as any,
                meta: testPackageJson3 as any,
            }];
        }
        return null;
    }
};

let testPackageJsonDefinitionBuilder3Calls = 0;
const testPackageJsonDefinitionBuilder3 = {
    name: 'Definition Builder 3',
    buildDefinition: async (packageURL: URL) => {
        if (testPackageJsonDefinitionBuilder3Calls === 0) {
            testPackageJsonDefinitionBuilder3Calls ++ ;
            return [{
                packageURL,
                definition: testPackageJson4.mashroom as any,
                meta: testPackageJson4 as any,
            }];
        }
        return [{
            packageURL,
            definition: testPackageJson5.mashroom as any,
            meta: testPackageJson5 as any,
        }];
    }
};

const testPackageJsonDefinitionBuilder4 = {
    name: 'Definition Builder 4',
    buildDefinition: async (packageURL: URL) => {
        return [{
            packageURL,
            definition: testPackageJson6.mashroom as any,
            meta: testPackageJson6 as any,
        }];
    }
};

const testPackageJsonDefinitionBuilder5 = {
    name: 'Definition Builder 5',
    buildDefinition: async (packageURL: URL) => {
        return [{
            packageURL: new URL('http://foo.bar/1'),
            definition: testPackageJson4.mashroom as any,
            meta: testPackageJson4 as any,
        }, {
            packageURL: new URL('http://foo.bar/2'),
            definition: testPackageJson5.mashroom as any,
            meta: testPackageJson5 as any,
        }];
    }
};

const builderOnMock = jest.fn();
const builderAddToBuildQueueMock = jest.fn();
const BuilderMock: any = jest.fn(() => ({
    on: builderOnMock,
    addToBuildQueue: builderAddToBuildQueueMock,
}));

const mockPluginContext: any = {
    serverConfig: {
        ignorePlugins: [],
        pluginPackageFolders: [{
            path: resolve('/foo'),
            devMode: true,
        }],
    }
};
const mockPluginContextHolder = {
    getPluginContext: () => mockPluginContext,
};

const mockPluginContext2: any = {
    serverConfig: {
        ignorePlugins: ['Plugin 1'],
        pluginPackageFolders: [{
            path: resolve('/foo'),
            devMode: false,
        }],
    }
};
const mockPluginContextHolder2 = {
    getPluginContext: () => mockPluginContext2,
};

let scannerCallback: MashroomPluginScannerCallback | undefined;
const mockScanner = {
    name: 'Scanner 1',
    setCallback: (callback: MashroomPluginScannerCallback) => {
        scannerCallback = callback;
    },
    start: async () => {},
    stop: async () => {},
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
        builderAddToBuildQueueMock.mockReset();
        mockPluginLoad.mockReset();
        mockPluginUnload.mockReset();
        scannerCallback = undefined;
        testPackageJsonDefinitionBuilder3Calls = 0;
    });

    it('reads a new package builds it and loads the plugins', async () => {
        const pluginPackagePath = resolve('/foo/bar');
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
                        pluginPackageName: 'foooo',
                        success: false,
                    });
                    buildFinishedCallback({
                        pluginPackageName: 'test1',
                        success: true,
                    });
                }
            }, 200);
        });

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, new BuilderMock());

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();
        expect(buildFinishedCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const potentialPluginPackages = pluginManager.potentialPluginPackages;
        expect(potentialPluginPackages.length).toBe(1);
        expect(potentialPluginPackages[0].status).toBe('processed');
        expect(potentialPluginPackages[0].processedOnce).toBeTruthy();
        expect(potentialPluginPackages[0].lastUpdate).toBeTruthy();
        expect(potentialPluginPackages[0].updateErrors).toBeFalsy();
        expect(potentialPluginPackages[0].scannerName).toBe('Scanner 1');
        expect(potentialPluginPackages[0].definitionBuilderName).toBe('Definition Builder 1');

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
        expect(plugins[0].lastReloadTs).toBeTruthy();

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
        const pluginPackagePath = resolve('/foo/bar');
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
                        pluginPackageName: 'test1',
                        success: false,
                        errorMessage: 'build errror!',
                    });
                }
            }, 200);
        });

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, new BuilderMock());

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();
        expect(buildFinishedCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const potentialPluginPackages = pluginManager.potentialPluginPackages;
        expect(potentialPluginPackages.length).toBe(1);
        expect(potentialPluginPackages[0].status).toBe('processed');

        const pluginPackages = pluginManager.pluginPackages;
        expect(pluginPackages[0].status).toBe('error');
        expect(pluginPackages[0].errorMessage).toBe('build errror!');

        const plugins = pluginManager.plugins;
        expect(plugins.length).toBe(0);
    });

    it('respects the plugin ignore list', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder2, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const potentialPluginPackages = pluginManager.potentialPluginPackages;
        expect(potentialPluginPackages.length).toBe(1);
        expect(potentialPluginPackages[0].status).toBe('processed');

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
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        let lowPriorityDefinitionBuilderCalled = false;
        pluginManager.registerPluginDefinitionBuilder(10, /* dummy */ {
            name: 'dummx',
            async buildDefinition(url: URL) {
                lowPriorityDefinitionBuilderCalled = true;
                return null;
            }
        });
        pluginManager.registerPluginDefinitionBuilder(11, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(lowPriorityDefinitionBuilderCalled).toBeFalsy();
        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);
    });

    it('reloads plugins if the package gets updated', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        let loadEvents = 0;
        let unloadEvents = 0;
        pluginManager.on('loaded', () => loadEvents ++);
        pluginManager.on('unloaded', () => unloadEvents ++);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const potentialPluginPackages = pluginManager.potentialPluginPackages;
        expect(potentialPluginPackages.length).toBe(1);
        expect(potentialPluginPackages[0].status).toBe('processed');

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);

        expect(mockPluginLoad).toHaveBeenCalledTimes(2);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
        expect(loadEvents).toBe(2);
        expect(unloadEvents).toBe(1);
    });

    it('loads a plugin in error state if the package gets updated', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        let loadEvents = 0;
        let unloadEvents = 0;
        pluginManager.on('loaded', () => loadEvents ++);
        pluginManager.on('unloaded', () => unloadEvents ++);

        expect(scannerCallback).toBeTruthy();

        // Start
        mockPluginLoad.mockImplementation(() => { throw new Error('Booom'); });

        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.plugins[0].name).toBe('Plugin 1');
        expect(pluginManager.plugins[0].status).toBe('error');
        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(0);

        // Update
        mockPluginLoad.mockImplementation(() => ({ }));

        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.plugins[0].name).toBe('Plugin 1');
        expect(pluginManager.plugins[0].status).toBe('loaded');
        expect(mockPluginLoad).toHaveBeenCalledTimes(2);
        expect(mockPluginUnload).toHaveBeenCalledTimes(0);
    });

    it('reloads plugins if the loader gets updated', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update the loader
        pluginManager.registerPluginLoader('web-app', mockPluginLoader);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);

        expect(mockPluginLoad).toHaveBeenCalledTimes(2);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('plugins are unloaded if package is removed', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Remove the package
        scannerCallback!.removePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(0);
        expect(pluginManager.plugins.length).toBe(0);

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('plugins are unloaded if package definition is removed', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Remove the definition builder and update
        pluginManager.unregisterPluginDefinitionBuilder(testPackageJsonDefinitionBuilder1);
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.potentialPluginPackages.length).toBe(1);
        expect(pluginManager.pluginPackages.length).toBe(0);
        expect(pluginManager.plugins.length).toBe(0);

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('plugins are unloaded if removed from the package definition', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        pluginManager.unregisterPluginDefinitionBuilder(testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1FirstPluginRemoved);

        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.potentialPluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(2);

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('plugins are loaded if added to the package definition', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        pluginManager.unregisterPluginDefinitionBuilder(testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1WithPluginAdded);

        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.potentialPluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(4);

        expect(mockPluginLoad).toHaveBeenCalledTimes(3);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('loads pending plugins if the correct load is registered and re-evaluates all plugins with missing requirements', async () => {
        const pluginPackage2URL = pathToFileURL('/foo/test2');
        const pluginPackage3URL = pathToFileURL('/foo/test3');

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder2);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackage2URL);

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
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginLoader('web-app2', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder3);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const plugins = pluginManager.plugins;
        expect(plugins.length).toBe(1);
        expect(plugins[0].name).toBe('Plugin 8');
        expect(plugins[0].type).toBe('web-app');

        // Update
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const plugins2 = pluginManager.plugins;
        expect(plugins2.length).toBe(1);
        expect(plugins2[0].name).toBe('Plugin 8');
        expect(plugins2[0].type).toBe('web-app2');

        expect(mockPluginLoad).toHaveBeenCalledTimes(2);
        expect(mockPluginUnload).toHaveBeenCalledTimes(1);
    });

    it('ignores potential packages without an definition', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, {
            name: 'dummy',
            async buildDefinition(url: URL) {
                return null;
            }
        });
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(0);
    });

    it('fails with invalid plugin package definitions', async () => {
        const pluginPackagePath = '/foo/bar';
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder4);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.pluginPackages[0].status).toBe('error');
        expect(pluginManager.pluginPackages[0].errorMessage).toBe('Plugin \'Plugin 4\' has no type property!');
    });

    it('handles multiple package definition for a potential package', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder5);
        pluginManager.registerPluginScanner(mockScanner);

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(2);
        expect(pluginManager.pluginPackages[0].pluginPackageURL.toString()).toBe('http://foo.bar/1');
        expect(pluginManager.pluginPackages[0].status).toBe('ready');
        expect(pluginManager.pluginPackages[1].pluginPackageURL.toString()).toBe('http://foo.bar/2');
        expect(pluginManager.pluginPackages[1].status).toBe('ready');
    });

    it('reloads plugins for remote packages only if the version changes', async () => {
        const pluginPackageURL = new URL('http://foo.bar/1');

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        expect(scannerCallback).toBeTruthy();

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(0);
    });

    it('keeps existing plugins if the plugin package definition cannot be built (temporary)', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, null);

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Add invalid definition builder
        pluginManager.unregisterPluginDefinitionBuilder(testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginDefinitionBuilder(0, {
            name: 'test',
            buildDefinition: async () => { throw new Error('booooom'); },
        });

        // Update
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(pluginManager.potentialPluginPackages.length).toBe(1);
        expect(pluginManager.potentialPluginPackages[0].status).toBe('processed');
        expect(pluginManager.potentialPluginPackages[0].updateErrors).toEqual(['booooom']);

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);

        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(0);
    });

    it('ignores package updates from scanners if it is currently processed', async () => {
        const pluginPackagePath = resolve('/foo/bar');
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
                        pluginPackageName: 'test1',
                        success: true,
                    });
                }
            }, 1000);
        });

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder, loggingUtils.dummyLoggerFactory, new BuilderMock());

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        pluginManager.registerPluginDefinitionBuilder(0, testPackageJsonDefinitionBuilder1);
        pluginManager.registerPluginScanner(mockScanner);

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        // Send some updates
        await new Promise((resolve) => setTimeout(() => {
            scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);
            resolve(null);
        }, 200));
        await new Promise((resolve) => setTimeout(() => {
            scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);
            resolve(null);
        }, 200));

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const potentialPluginPackages = pluginManager.potentialPluginPackages;
        expect(potentialPluginPackages.length).toBe(1);
        expect(potentialPluginPackages[0].status).toBe('processed');

        expect(builderAddToBuildQueueMock).toHaveBeenCalledTimes(1);
        expect(mockPluginLoad).toHaveBeenCalledTimes(1);
        expect(mockPluginUnload).toHaveBeenCalledTimes(0);
    });

    it('retries building plugin package definition if an error occurs', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder,
            loggingUtils.dummyLoggerFactory, null, 1000, 3);
        await pluginManager.start();

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        let attempt = 0;
        pluginManager.registerPluginDefinitionBuilder(0, {
            name: 'test',
            buildDefinition: async () => {
                attempt ++;
                if (attempt === 1) {
                    throw new Error('boooom');
                }
                return [{
                    packageURL: pluginPackageURL,
                    definition: testPackageJson1.mashroom as any,
                    meta: testPackageJson1 as any,
                }];
            },
        });
        pluginManager.registerPluginScanner(mockScanner);

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        await pluginManager.stop();

        expect(attempt).toBe(2);

        expect(pluginManager.potentialPluginPackages.length).toBe(1);
        expect(pluginManager.potentialPluginPackages[0].status).toBe('processed');
        expect(pluginManager.potentialPluginPackages[0].updateErrors).toBeFalsy();

        expect(pluginManager.pluginPackages.length).toBe(1);
        expect(pluginManager.plugins.length).toBe(3);
    });

    it('retries building plugin package definition only until max retries is reached', async () => {
        const pluginPackagePath = resolve('/foo/bar');
        const pluginPackageURL = pathToFileURL(pluginPackagePath);

        const pluginManager = new MashroomPluginManager(mockPluginContextHolder,
            loggingUtils.dummyLoggerFactory, null, 500, 3);
        await pluginManager.start();

        pluginManager.registerPluginLoader('web-app', mockPluginLoader);
        let attempt = 0;
        pluginManager.registerPluginDefinitionBuilder(0, {
            name: 'test',
            buildDefinition: async () => {
                attempt ++;
                throw new Error('boooom');
            },
        });
        pluginManager.registerPluginScanner(mockScanner);

        // Start
        scannerCallback!.addOrUpdatePackageURL(pluginPackageURL);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await pluginManager.stop();

        expect(attempt).toBe(3);

        expect(pluginManager.potentialPluginPackages.length).toBe(1);
        expect(pluginManager.potentialPluginPackages[0].status).toBe('processed');
        expect(pluginManager.potentialPluginPackages[0].updateErrors).toBeTruthy();
    });
});
