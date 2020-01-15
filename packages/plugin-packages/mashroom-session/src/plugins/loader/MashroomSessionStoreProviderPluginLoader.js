// @flow

import session from 'express-session';

import type {MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSessionStoreProvider,
    MashroomSessionStoreProviderPluginBootstrapFunction,
} from '../../../type-definitions';
import type {
    MashroomSessionStoreProviderRegistry,
} from '../../../type-definitions/internal';

export default class MashroomSessionStoreProviderPluginLoader implements MashroomPluginLoader {

    _registry: MashroomSessionStoreProviderRegistry;
    _log: MashroomLogger;

    constructor(registry: MashroomSessionStoreProviderRegistry, loggerFactory: MashroomLoggerFactory) {
        this._registry = registry;
        this._log = loggerFactory('mashroom.session.store.plugin.loader');
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
        this._log.info(`Registering session store provider plugin: ${plugin.name}`);
        this._registry.register(plugin.name, provider);
    }

    async unload(plugin: MashroomPlugin) {
        this._log.info(`Unregistering session store provider plugin: ${plugin.name}`);
        this._registry.unregister(plugin.name);
    }
}
