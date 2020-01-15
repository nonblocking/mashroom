// @flow

import type {MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityProvider,
    MashroomSecurityProviderPluginBootstrapFunction,
} from '../../../type-definitions';
import type {
    MashroomSecurityProviderRegistry,
} from '../../../type-definitions/internal';

export default class MashroomSecurityProviderPluginLoader implements MashroomPluginLoader {

    _registry: MashroomSecurityProviderRegistry;
    _log: MashroomLogger;

    constructor(registry: MashroomSecurityProviderRegistry, loggerFactory: MashroomLoggerFactory) {
        this._registry = registry;
        this._log = loggerFactory('mashroom.security.plugin.loader');
    }

    get name(): string {
        return 'Security Provider Plugin Loader';
    }

    generateMinimumConfig() {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = plugin.requireBootstrap();
        const provider: MashroomSecurityProvider = await bootstrap(plugin.name, config, contextHolder);
        this._log.info(`Registering security provider plugin: ${plugin.name}`);
        this._registry.register(plugin.name, provider);
    }

    async unload(plugin: MashroomPlugin) {
        this._log.info(`Unregistering security provider plugin: ${plugin.name}`);
        this._registry.unregister(plugin.name);
    }
}
