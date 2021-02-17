
import type {MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityProvider,
    MashroomSecurityProviderPluginBootstrapFunction,
} from '../../../type-definitions';
import type {MashroomSecurityProviderRegistry} from '../../../type-definitions/internal';

export default class MashroomSecurityProviderPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomSecurityProviderRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.security.plugin.loader');
    }

    get name(): string {
        return 'Security Provider Plugin Loader';
    }

    generateMinimumConfig(): MashroomPluginConfig {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = plugin.requireBootstrap();
        const provider: MashroomSecurityProvider = await bootstrap(plugin.name, config, contextHolder);
        this._logger.info(`Registering security provider plugin: ${plugin.name}`);
        this._registry.register(plugin.name, provider);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering security provider plugin: ${plugin.name}`);
        this._registry.unregister(plugin.name);
    }
}
