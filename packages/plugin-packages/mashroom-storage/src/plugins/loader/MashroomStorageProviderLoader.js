// @flow

import type {
    MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig,
    MashroomPluginContextHolder, MashroomLoggerFactory, MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomStoragePluginBootstrapFunction, MashroomStorageRegistry} from '../../../type-definitions';

export default class MashroomStorageProviderLoader implements MashroomPluginLoader {

    _storageRegistry: MashroomStorageRegistry;
    _log: MashroomLogger;

    constructor(storageRegistry: MashroomStorageRegistry, loggerFactory: MashroomLoggerFactory) {
        this._storageRegistry = storageRegistry;
        this._log = loggerFactory('mashroom.storage.loader');
    }

    generateMinimumConfig() {
        return {
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const bootstrap: MashroomStoragePluginBootstrapFunction = plugin.requireBootstrap();
        const storageProvider = await bootstrap(plugin.name, config, contextHolder);
        this._log.info(`Registering storage provider: ${plugin.name}`);
        this._storageRegistry.registerStorage(plugin.name, storageProvider);

    }

    async unload(plugin: MashroomPlugin) {
        this._log.info(`Unregistering storage provider: ${plugin.name}`);
        this._storageRegistry.unregisterStorage(plugin.name);
    }

    get name(): string {
        return 'Storage Provider Plugin Loader';
    }

}
