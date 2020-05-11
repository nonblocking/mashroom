
import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLoggerFactory,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomStoragePluginBootstrapFunction} from '../../../type-definitions';
import type {MashroomStorageRegistry} from '../../../type-definitions/internal';

export default class MashroomStorageProviderLoader implements MashroomPluginLoader {

    private logger: MashroomLogger;

    constructor(private storageRegistry: MashroomStorageRegistry, private loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.storage.loader');
    }

    generateMinimumConfig(): MashroomPluginConfig {
        return {
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const bootstrap: MashroomStoragePluginBootstrapFunction = plugin.requireBootstrap();
        const storageProvider = await bootstrap(plugin.name, config, contextHolder);
        this.logger.info(`Registering storage provider: ${plugin.name}`);
        this.storageRegistry.registerStorage(plugin.name, storageProvider);

    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this.logger.info(`Unregistering storage provider: ${plugin.name}`);
        this.storageRegistry.unregisterStorage(plugin.name);
    }

    get name(): string {
        return 'Storage Provider Plugin Loader';
    }

}
