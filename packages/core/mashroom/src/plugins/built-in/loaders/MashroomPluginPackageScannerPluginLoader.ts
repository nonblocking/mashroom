
import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLoggerFactory,
    MashroomLogger,
    MashroomPluginPackageScannerPluginBootstrapFunction,
    MashroomPluginPackageScanner,
} from '../../../../type-definitions';
import type {
    MashroomPluginRegistry,
} from '../../../../type-definitions/internal';

export default class MashroomServicePluginLoader implements MashroomPluginLoader {

    private readonly _logger: MashroomLogger;
    private readonly _loadedPlugins: Map<string, MashroomPluginPackageScanner>;

    constructor(private _pluginRegistry: MashroomPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.loader');
        this._loadedPlugins = new Map();
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const bootstrap: MashroomPluginPackageScannerPluginBootstrapFunction = await plugin.loadBootstrap();
        const pluginPackageScanner = await bootstrap(plugin.name, config, contextHolder);

        this._logger.info('Loading plugin package scanner:', pluginPackageScanner.name);
        this._pluginRegistry.registerPluginScanner(pluginPackageScanner);
        this._loadedPlugins.set(plugin.name, pluginPackageScanner);
    }

    async unload(plugin: MashroomPlugin) {
        const pluginPackageScanner = this._loadedPlugins.get(plugin.name);
        if (pluginPackageScanner) {
            this._logger.info(`Unloading plugin package scanner:`, pluginPackageScanner.name);
            this._pluginRegistry.unregisterPluginScanner(pluginPackageScanner);
            this._loadedPlugins.delete(plugin.name);
        }
    }

    get name(): string {
        return 'Plugin Package Scanner Plugin Loader';
    }

}
