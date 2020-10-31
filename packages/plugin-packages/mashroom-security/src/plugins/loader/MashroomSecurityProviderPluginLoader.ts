
import type {MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityProvider,
    MashroomSecurityProviderPluginBootstrapFunction,
} from '../../../type-definitions';
import type {MashroomSecurityProviderRegistry} from '../../../type-definitions/internal';

export default class MashroomSecurityProviderPluginLoader implements MashroomPluginLoader {

    private logger: MashroomLogger;

    constructor(private registry: MashroomSecurityProviderRegistry, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.security.plugin.loader');
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
        this.logger.info(`Registering security provider plugin: ${plugin.name}`);
        this.registry.register(plugin.name, provider);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this.logger.info(`Unregistering security provider plugin: ${plugin.name}`);
        this.registry.unregister(plugin.name);
    }
}
