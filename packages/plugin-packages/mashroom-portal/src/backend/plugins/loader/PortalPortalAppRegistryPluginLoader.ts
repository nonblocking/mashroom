
import type {MashroomLogger, MashroomLoggerFactory, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomPluginLoader} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalAppRegistryBootstrapFunction} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry, MashroomPortalAppRegistryHolder} from '../../../../type-definitions/internal';

export default class PortalPortalAppRegistryPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Registry Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig {
        return {
            priority: 1
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const bootstrap: MashroomPortalAppRegistryBootstrapFunction = plugin.requireBootstrap();
        const registry = await bootstrap(plugin.name, config, contextHolder);

        const { priority } = config;

        const registryHolder: MashroomPortalAppRegistryHolder = {
            name: plugin.name,
            registry,
            priority
        };

        this._logger.info('Registering portal app registry:', {registry: registryHolder});
        this._registry.registerPortalAppRegistry(registryHolder);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering portal app registry: ${plugin.name}`);
        this._registry.unregisterPortalAppRegistry(plugin.name);
    }
}
