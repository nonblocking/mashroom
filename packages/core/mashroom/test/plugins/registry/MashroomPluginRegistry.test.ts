
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomPluginRegistry from '../../../src/plugins/registry/MashroomPluginRegistry';

const scannerOnMock = jest.fn();
const ScannerMock: any = jest.fn(() => ({
    on: scannerOnMock,
}));

const pluginPackageOnMock = jest.fn();
const PluginPackageMock: any = jest.fn(() => ({
    on: pluginPackageOnMock,
}));

const pluginPackageFactoryMock: any = jest.fn(() => new PluginPackageMock());
const pluginFactoryMock: any = jest.fn();

const pluginLoaderLoadMock = jest.fn();
const pluginLoaderUnloadMock = jest.fn();
const PluginLoaderMock: any = jest.fn(() => ({
    generateMinimumConfig: () => { /* nothing to do */ },
    load: pluginLoaderLoadMock,
    unload: pluginLoaderUnloadMock,
}));

const PluginContextHolderMock: any = jest.fn();

describe('MashroomPluginRegistry', () => {

    beforeEach(() => {
        scannerOnMock.mockReset();
        pluginFactoryMock.mockReset();
        pluginPackageOnMock.mockReset();
        pluginLoaderLoadMock.mockReset();
        pluginLoaderUnloadMock.mockReset();
        PluginContextHolderMock.mockReset();
    });

    it('creates a new plugin package when a package is added on the filesystem', () => {
        scannerOnMock.mockImplementation((eventName, callback) => {
           if (eventName === 'packageAdded') {
               callback('/packages/plugin1');
           }
        });

        new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);

        expect(pluginPackageFactoryMock.mock.calls.length).toBe(1);
        expect(pluginPackageFactoryMock.mock.calls[0][0]).toBe('/packages/plugin1');
    });

    it('loads the plugin when the build is finished', (done) => {
        const pluginPackage = new PluginPackageMock();
        const plugin = {
            name: 'plugin1',
            type: 'foo',
            pluginDefinition: {
            },
        };

        pluginPackageFactoryMock.mockImplementation(() => pluginPackage);
        pluginPackageOnMock.mockImplementation((eventName, callback) => {
            if (eventName === 'ready') {
                callback({
                    pluginsAdded: [plugin],
                    pluginPackage,
                });
            }
        });

        let loaded = false;
        pluginFactoryMock.mockImplementation((pluginDefinition: any, pluginPackage: any, connector: any) => {
            connector.on('loaded', () => loaded = true);
            return plugin;
        });

        let packageAddedCallback = (path: string) => { /* nothing to do */ };
        scannerOnMock.mockImplementation((eventName, callback) => {
            if (eventName === 'packageAdded') {
                packageAddedCallback = callback;
            }
        });

        const context = {
            serverConfig: {
                plugins: [],
            },
        };
        PluginContextHolderMock.mockImplementation(() => ({
            getPluginContext: () => context,
        }));

        const contextHolder = new PluginContextHolderMock();
        const onLoadedMock = jest.fn();

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, contextHolder, dummyLoggerFactory);
        registry.on('loaded', onLoadedMock);
        registry.registerPluginLoader('foo', new PluginLoaderMock());

        packageAddedCallback('/packages/plugin2');

        expect(pluginLoaderLoadMock.mock.calls.length).toBe(1);
        expect(pluginLoaderLoadMock.mock.calls[0][0]).toBe(plugin);
        expect(pluginLoaderLoadMock.mock.calls[0][2]).toBe(contextHolder);
        expect(registry.plugins.length).toBe(1);

        setTimeout(() => {
            expect(loaded).toBeTruthy();
            expect(onLoadedMock.mock.calls.length).toBe(1);
            done();
        }, 100);
    });

    it('sets the error state correctly if the loading fails', () => {
        const pluginPackage = new PluginPackageMock();
        const plugin = {
            name: 'plugin1',
            type: 'foo2',
        };

        pluginPackageFactoryMock.mockImplementation(() => pluginPackage);
        pluginPackageOnMock.mockImplementation((eventName, callback) => {
            if (eventName === 'ready') {
                callback({
                    pluginsAdded: [plugin],
                    pluginPackage,
                });
            }
        });

        let error = false;
        pluginFactoryMock.mockImplementation((pluginDefinition: any, pluginPackage: any, connector: any) => {
            connector.on('error', () => error = true);
            return plugin;
        });

        let packageAddedCallback = (path: string) => { /* nothing to do */ };
        scannerOnMock.mockImplementation((eventName, callback) => {
            if (eventName === 'packageAdded') {
                packageAddedCallback = callback;
            }
        });

        const context = {};
        PluginContextHolderMock.mockImplementation(() => ({
            getPluginContext: () => context,
        }));

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);

        packageAddedCallback('/packages/plugin2');

        expect(pluginLoaderLoadMock.mock.calls.length).toBe(0);
        expect(registry.plugins.length).toBe(1);
        expect(error).toBeTruthy();
    });

    it('notifies the plugin package about updates', () => {
        const connectorEmitUpdatedMock = jest.fn();
        const ConnectorMock: any = jest.fn(() => ({
            emitUpdated: connectorEmitUpdatedMock,
        }));

        const pluginPackage: any = {
            pluginPackagePath: '/foo/bar',
        };

        let packageUpdatedCallback = (path: string) => { /* nothing to do */ };
        scannerOnMock.mockImplementation((eventName, callback) => {
            if (eventName === 'packageUpdated') {
                packageUpdatedCallback = callback;
            }
        });

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);
        // @ts-ignore
        registry._pluginPackages.set(pluginPackage, new ConnectorMock());

        packageUpdatedCallback('/foo/bar');
        packageUpdatedCallback('/bar');

        expect(connectorEmitUpdatedMock.mock.calls.length).toBe(1);
    });

    it('notifies the plugin package when the package is removed on the filesystem', () => {
        const connectorEmitRemovedMock = jest.fn();
        const ConnectorMock: any = jest.fn(() => ({
            emitRemoved: connectorEmitRemovedMock,
        }));

        const pluginPackageRemoveListenerMock = jest.fn();
        const PluginPackageMock: any = jest.fn(() => ({
            removeListener: pluginPackageRemoveListenerMock,
            pluginPackagePath: '/bar',
        }));

        let packageRemovedCallback = (path: string) => { /* nothing to do */ };
        scannerOnMock.mockImplementation((eventName, callback) => {
            if (eventName === 'packageRemoved') {
                packageRemovedCallback = callback;
            }
        });

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);
        // @ts-ignore
        registry._pluginPackages.set(new PluginPackageMock(), new ConnectorMock());

        packageRemovedCallback('/bar');

        expect(connectorEmitRemovedMock.mock.calls.length).toBe(1);
        expect(pluginPackageRemoveListenerMock.mock.calls.length).toBe(2);
    });

    it('removes and adds a plugin if the type changes', (done) => {
        const pluginPackage: any = {
            pluginPackagePath: '/foo2',
        };
        const existingPlugin: any = {
            name: 'plugin7',
            type: 'foo',
            pluginDefinition: {
            },
        };
        const newPluginDef: any = {
            name: 'plugin7',
            type: 'bar',
        };
        const newPlugin: any = {
            name: 'plugin7',
            type: 'foo',
            pluginDefinition: newPluginDef,
        };

        const context = {
            serverConfig: {
                plugins: [],
            },
        };
        PluginContextHolderMock.mockImplementation(() => ({
            getPluginContext: () => context,
        }));

        const connectorEmitUpdatedMock = jest.fn();
        const connectorEmitLoadedMock = jest.fn();
        const ConnectorMock: any = jest.fn(() => ({
            emitUpdated: connectorEmitUpdatedMock,
            emitLoaded: connectorEmitLoadedMock,
        }));

        let loaded = false;
        pluginFactoryMock.mockImplementation((pluginDefinition: any, pluginPackage: any, connector: any) => {
            connector.on('loaded', () => loaded = true);
            return newPlugin;
        });
        const onLoadedMock = jest.fn();
        const onUnloadMock = jest.fn();

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);
        // @ts-ignore
        registry._pluginPackages.set(pluginPackage, new ConnectorMock());
        // @ts-ignore
        registry._plugins.set(existingPlugin, new ConnectorMock());
        registry.on('loaded', onLoadedMock);
        registry.on('unload', onUnloadMock);
        registry.registerPluginLoader('foo', new PluginLoaderMock());
        registry.registerPluginLoader('bar', new PluginLoaderMock());

        // @ts-ignore
        registry._onPackageReady({
            pluginsUpdated: [newPluginDef],
            pluginPackage,
        });

        setTimeout(() => {
            // @ts-ignore
            expect(registry._plugins.size).toBe(1);
            expect(pluginLoaderLoadMock.mock.calls.length).toBe(1);
            expect(pluginLoaderUnloadMock.mock.calls.length).toBe(1);
            expect(pluginLoaderUnloadMock.mock.calls[0][0]).toBe(existingPlugin);
            expect(loaded).toBeTruthy();
            expect(onLoadedMock.mock.calls.length).toBe(1);
            expect(onUnloadMock.mock.calls.length).toBe(1);
            done();
        }, 200);
    });

    it('checks all unloaded plugins again when a new plugin loader has been added', () => {
        const pluginPackage: any = {
            pluginPackagePath: '/foo2',
        };
        const unloadedPlugin: any = {
            name: 'plugin8',
            type: 'foo3',
            pluginDefinition: {
            },
        };

        const context = {
            serverConfig: {
                plugins: [],
            },
        };
        PluginContextHolderMock.mockImplementation(() => ({
            getPluginContext: () => context,
        }));

        const connectorEmitLoadedMock = jest.fn();
        const ConnectorMock: any = jest.fn(() => ({
            emitLoaded: connectorEmitLoadedMock,
        }));

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);
        // @ts-ignore
        registry._pluginPackages.set(pluginPackage, new ConnectorMock());
        // @ts-ignore
        registry._plugins.set(unloadedPlugin, new ConnectorMock());
        // @ts-ignore
        registry._pluginsNoLoader.push(unloadedPlugin);

        registry.registerPluginLoader('foo3', new PluginLoaderMock());

        expect(pluginLoaderLoadMock.mock.calls.length).toBe(1);
        // @ts-ignore
        expect(registry._pluginsNoLoader.length).toBe(0);
    });

    it('re-load all loaded plugins if the responsible loader gets reloaded', (done) => {
        const pluginPackage: any = {
            pluginPackagePath: '/foo2',
        };
        const loadedPlugin: any = {
            name: 'plugin10',
            type: 'foo10',
            status: 'loaded',
            pluginDefinition: {
            },
        };
        const otherPlugin: any = {
            name: 'plugin11',
            type: 'foo11',
            status: 'loaded',
            pluginDefinition: {
            },
        };

        const context = {
            serverConfig: {
                plugins: [],
            },
        };
        PluginContextHolderMock.mockImplementation(() => ({
            getPluginContext: () => context,
        }));

        const connectorEmitLoadedMock = jest.fn();
        const onLoadedMock = jest.fn();
        const ConnectorMock: any = jest.fn(() => ({
            emitLoaded: connectorEmitLoadedMock,
        }));

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);
        // @ts-ignore
        registry._pluginPackages.set(pluginPackage, new ConnectorMock());
        // @ts-ignore
        registry._pluginPackages.set(otherPlugin, new ConnectorMock());
        // @ts-ignore
        registry._plugins.set(loadedPlugin, new ConnectorMock());
        registry.on('loaded', onLoadedMock);

        registry.registerPluginLoader('foo10', new PluginLoaderMock());

        setTimeout(() => {
            expect(pluginLoaderLoadMock.mock.calls.length).toBe(1);
            expect(onLoadedMock.mock.calls.length).toBe(1);
            done();
        }, 100);
    });

    it('doesn\'t load a plugin if a required plugin is not loaded', () => {
        const pluginPackage = new PluginPackageMock();
        const plugin: any = {
            name: 'plugin5',
            type: 'foo',
            pluginDefinition: {
                requires: ['bar'],
            },
        };

        let error = false;
        pluginFactoryMock.mockImplementation((pluginDefinition: any, pluginPackage: any, connector: any) => {
            connector.on('error', () => error = true);
            return plugin;
        });

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);
        registry.registerPluginLoader('foo', new PluginLoaderMock());

        // @ts-ignore
        registry._onPackageReady({
            pluginsAdded: [plugin],
            pluginPackage,
        });

        expect(pluginLoaderLoadMock.mock.calls.length).toBe(0);
        expect(registry.plugins.length).toBe(1);
        expect(error).toBeTruthy();
        // @ts-ignore
        expect(registry._pluginsMissingRequirements.length).toBe(1);
    });

    it('re-checks all plugins with missing requirements after new plugin is loaded', (done) => {
        const pluginPackage: any = {
            pluginPackagePath: '/foo2',
        };
        const pluginMissingRequirements: any = {
            name: 'plugin5',
            type: 'foo',
            requires: ['bar'],
            pluginDefinition: {
            },
        };
        const requiredPluginDef: any = {
            name: 'bar',
            type: 'foo',
        };
        const requiredPlugin: any = {
            name: 'bar',
            type: 'foo',
            status: 'loaded',
            pluginDefinition: requiredPluginDef,
        };

        const context = {
            serverConfig: {
                plugins: [],
            },
        };
        PluginContextHolderMock.mockImplementation(() => ({
            getPluginContext: () => context,
        }));

        const connectorEmitLoadedMock = jest.fn();
        const ConnectorMock: any = jest.fn(() => ({
            emitLoaded: connectorEmitLoadedMock,
        }));

        let loaded = false;
        pluginFactoryMock.mockImplementation((pluginDefinition: any, pluginPackage: any, connector: any) => {
            connector.on('loaded', () => loaded = true);
            return requiredPlugin;
        });

        const registry = new MashroomPluginRegistry(new ScannerMock(), pluginPackageFactoryMock, pluginFactoryMock, new PluginContextHolderMock(), dummyLoggerFactory);
        // @ts-ignore
        registry._pluginPackages.set(pluginPackage, new ConnectorMock());
        // @ts-ignore
        registry._plugins.set(pluginMissingRequirements, new ConnectorMock());
        // @ts-ignore
        registry._pluginsMissingRequirements.push(pluginMissingRequirements);
        registry.registerPluginLoader('foo', new PluginLoaderMock());

        // @ts-ignore
        registry._addPlugin(requiredPluginDef, pluginPackage);

        setTimeout(() => {
            expect(pluginLoaderLoadMock.mock.calls.length).toBe(2);
            // @ts-ignore
            expect(registry._pluginsMissingRequirements.length).toBe(0);
            expect(loaded).toBeTruthy();
            done();
        }, 100);
    });

});
