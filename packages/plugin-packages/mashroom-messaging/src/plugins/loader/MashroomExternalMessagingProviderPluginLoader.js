// @flow

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

    _registry: MashroomExternalMessagingProviderRegistry;
    _log: MashroomLogger;

    constructor(registry: MashroomExternalMessagingProviderRegistry, loggerFactory: MashroomLoggerFactory) {
        this._registry = registry;
        this._log = loggerFactory('mashroom.messaging.plugin.loader');
    }

    get name(): string {
        return 'Messaging External Provider Plugin Loader';
    }

    generateMinimumConfig() {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = plugin.requireBootstrap();
        const provider: MashroomMessagingExternalProvider = await bootstrap(plugin.name, config, contextHolder);
        this._log.info(`Registering external messaging provider plugin: ${plugin.name}`);
        this._registry.register(plugin.name, provider);
    }

    async unload(plugin: MashroomPlugin) {
        this._log.info(`Unregistering external messaging provider plugin: ${plugin.name}`);
        this._registry.unregister(plugin.name);
    }
}
