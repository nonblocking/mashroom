
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomPluginLoader
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalAppConfig,
    MashroomPortalAppConfigPluginBootstrapFunction,
} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../../type-definitions/internal';

export default class PortalAppEnhancementPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Config Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig {
        return {
            order: 1000,
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        let pluginAppConfigPlugin;

        const bootstrap: MashroomPortalAppConfigPluginBootstrapFunction = await plugin.loadBootstrap();
        pluginAppConfigPlugin = bootstrap(plugin.name, config, contextHolder);

        const pluginAppConfig: MashroomPortalAppConfig = {
            name: plugin.name,
            description: plugin.description,
            order: config.order,
            plugin: pluginAppConfigPlugin,
        };


        this._logger.info('Registering Portal App config:', JSON.stringify({pluginAppConfig}));
        this._registry.registerPortalAppConfig(pluginAppConfig);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering Portal App config: ${plugin.name}`);
        this._registry.unregisterPortalAppConfig(plugin.name);
    }
}
