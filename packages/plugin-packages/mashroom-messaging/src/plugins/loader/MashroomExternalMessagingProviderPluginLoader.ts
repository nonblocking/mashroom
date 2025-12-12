
import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomMessagingExternalProvider,
    MashroomExternalMessagingProviderPluginBootstrapFunction,
} from '../../../type-definitions';
import type {
    MashroomExternalMessagingProviderRegistry,
} from '../../../type-definitions/internal';

export default class MashroomExternalMessagingProviderPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomExternalMessagingProviderRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.messaging.plugin.loader');
    }

    get name(): string {
        return 'Messaging External Provider Plugin Loader';
    }

    generateMinimumConfig(): MashroomPluginConfig {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = await plugin.loadBootstrap();
        const provider: MashroomMessagingExternalProvider = await bootstrap(plugin.name, config, contextHolder);
        this._logger.info(`Registering external messaging provider plugin: ${plugin.name}`);
        this._registry.register(plugin.name, provider);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering external messaging provider plugin: ${plugin.name}`);
        this._registry.unregister(plugin.name);
    }
}
