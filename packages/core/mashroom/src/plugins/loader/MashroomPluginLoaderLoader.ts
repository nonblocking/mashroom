
import builtInLoaders from './built_in_loaders';
import PluginConfigurationError from '@mashroom/mashroom-utils/lib/PluginConfigurationError';

import type {
    MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomLoggerFactory,
    MashroomPluginContextHolder, MashroomLogger, MashroomPluginType, MashroomPluginLoaderPluginBootstrapFunction,
} from '../../../type-definitions';
import type {
    MashroomPluginRegistry,
} from '../../../type-definitions/internal';

export default class MashroomPluginLoaderLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;
    private _loadedPlugins: Map<string, MashroomPluginLoader>;

    constructor(private _pluginRegistry: MashroomPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.loader');
        this._loadedPlugins = new Map();
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {};
    }

    async load(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        this._checkConfig(plugin);

        const targetPluginType: MashroomPluginType = plugin.pluginDefinition.loads;
        let previousTargetPluginType = null;
        for (const existingType of this._loadedPlugins.keys()) {
            const existingPlugin = this._loadedPlugins.get(existingType);
            if (existingPlugin && existingPlugin.name === plugin.name) {
                previousTargetPluginType = existingType;
                break;
            }
        }

        const pluginLoaderInstance: MashroomPluginLoader = await this._createPluginInstance(plugin, pluginConfig, contextHolder);

        if (previousTargetPluginType && previousTargetPluginType !== targetPluginType) {
            this._logger.info(`loads property of plugin ${plugin.name} changed from ${previousTargetPluginType} to ${targetPluginType}`);
            const previousTargetPlugin = this._pluginRegistry.pluginLoaders[previousTargetPluginType];
            if (previousTargetPlugin) {
                this._pluginRegistry.unregisterPluginLoader(previousTargetPluginType, previousTargetPlugin);
            }
            this._loadedPlugins.delete(previousTargetPluginType);
        }

        this._logger.info(`Registering loader plugin for type: ${targetPluginType}`);
        this._pluginRegistry.registerPluginLoader(targetPluginType, pluginLoaderInstance);
        this._loadedPlugins.set(targetPluginType, pluginLoaderInstance);
    }

    async unload(plugin: MashroomPlugin) {
        this._checkConfig(plugin);

        const targetPluginType: MashroomPluginType = plugin.pluginDefinition.loads;
        const loadedPlugin = this._loadedPlugins.get(targetPluginType);
        if (loadedPlugin) {
            this._logger.info(`Unregistering loader plugin for type: ${targetPluginType}`);
            this._pluginRegistry.unregisterPluginLoader(targetPluginType, loadedPlugin);

            this._loadedPlugins.delete(targetPluginType);
        }
    }

    get name(): string {
        return 'Plugin Loader Loader';
    }

    private _checkConfig(plugin: MashroomPlugin) {
        const loads: string | undefined | null = plugin.pluginDefinition.loads;
        if (!loads) {
            throw new PluginConfigurationError(`Loader plugin ${plugin.name} is missing property 'loads'!`);
        }
        if (builtInLoaders.indexOf(loads) !== -1) {
            throw new PluginConfigurationError(`Loader plugin ${plugin.name} tries to override a built in loader: ${loads}!`);
        }
    }

    private async _createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const pluginLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = plugin.requireBootstrap();
        return pluginLoaderBootstrap(plugin.name, pluginConfig, contextHolder);
    }


}
