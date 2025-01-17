
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomPluginLoader
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalAppEnhancement,
    MashroomPortalAppEnhancementPluginBootstrapFunction
} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../../type-definitions/internal';

export default class PortalAppEnhancementPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Enhancement Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        let enhancementPlugin;
        if (plugin.pluginDefinition.bootstrap) {
            const bootstrap: MashroomPortalAppEnhancementPluginBootstrapFunction = plugin.requireBootstrap();
            enhancementPlugin = bootstrap && await bootstrap(plugin.name, config, contextHolder);
        }

        const portalCustomClientServices = plugin.pluginDefinition.portalCustomClientServices || {};

        const enhancement: MashroomPortalAppEnhancement = {
            name: plugin.name,
            description: plugin.description,
            portalCustomClientServices,
            plugin: enhancementPlugin,
        };


        this._logger.info('Registering portal app enhancement:', JSON.stringify({enhancement}));
        this._registry.registerPortalAppEnhancement(enhancement);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering portal app enhancement: ${plugin.name}`);
        this._registry.unregisterPortalAppEnhancement(plugin.name);
    }
}
