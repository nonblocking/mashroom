
import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLoggerFactory,
    MashroomLogger,
    MashroomPluginPackageDefinitionBuilderPluginBootstrapFunction,
    MashroomPluginPackageDefinitionBuilder,
} from '../../../../type-definitions';
import type {
    MashroomPluginRegistry,
} from '../../../../type-definitions/internal';

export default class MashroomServicePluginLoader implements MashroomPluginLoader {

    private readonly _logger: MashroomLogger;
    private readonly _loadedPlugins: Map<string, MashroomPluginPackageDefinitionBuilder>;

    constructor(private _pluginRegistry: MashroomPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.loader');
        this._loadedPlugins = new Map();
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {
            order: 1000,
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const bootstrap: MashroomPluginPackageDefinitionBuilderPluginBootstrapFunction = await plugin.loadBootstrap();
        const pluginPackageDefinitionBuilder = await bootstrap(plugin.name, config, contextHolder);

        this._logger.info('Loading plugin package definition builder:', pluginPackageDefinitionBuilder.name);
        this._pluginRegistry.registerPluginDefinitionBuilder(config.order, pluginPackageDefinitionBuilder);
        this._loadedPlugins.set(plugin.name, pluginPackageDefinitionBuilder);
    }

    async unload(plugin: MashroomPlugin) {
        const pluginPackageDefinitionBuilder = this._loadedPlugins.get(plugin.name);
        if (pluginPackageDefinitionBuilder) {
            this._logger.info(`Unloading plugin package definition builder:`, pluginPackageDefinitionBuilder.name);
            this._pluginRegistry.unregisterPluginDefinitionBuilder(pluginPackageDefinitionBuilder);
            this._loadedPlugins.delete(plugin.name);
        }
    }

    get name(): string {
        return 'Plugin Package Scanner Plugin Loader';
    }

}
