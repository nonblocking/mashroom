
import session from 'express-session';

import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSessionStoreProvider,
    MashroomSessionStoreProviderPluginBootstrapFunction,
} from '../../../type-definitions';
import type {
    MashroomSessionStoreProviderRegistry,
} from '../../../type-definitions/internal';

export default class MashroomSessionStoreProviderPluginLoader implements MashroomPluginLoader {

    private logger: MashroomLogger;

    constructor(private registry: MashroomSessionStoreProviderRegistry, private loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.session.store.plugin.loader');
    }

    get name(): string {
        return 'Session Store Provider Plugin Loader';
    }

    generateMinimumConfig() {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = plugin.requireBootstrap();
        const provider: MashroomSessionStoreProvider = await bootstrap(plugin.name, config, contextHolder, session);
        this.logger.info(`Registering session store provider plugin: ${plugin.name}`);
        this.registry.register(plugin.name, provider);
    }

    async unload(plugin: MashroomPlugin) {
        this.logger.info(`Unregistering session store provider plugin: ${plugin.name}`);
        this.registry.unregister(plugin.name);
    }
}
