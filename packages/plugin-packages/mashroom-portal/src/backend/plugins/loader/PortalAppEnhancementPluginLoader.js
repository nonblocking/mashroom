// @flow

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

    _registry: MashroomPortalPluginRegistry;
    _log: MashroomLogger;

    constructor(registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._registry = registry;
        this._log = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Enhancement Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {

        const bootstrap: MashroomPortalAppEnhancementPluginBootstrapFunction = plugin.requireBootstrap();
        const enhancementPlugin = await bootstrap(plugin.name, config, contextHolder);

        const portalCustomClientServices = plugin.pluginDefinition.portalCustomClientServices || {};

        const enhancement: MashroomPortalAppEnhancement = {
            name: plugin.name,
            description: plugin.description,
            portalCustomClientServices,
            plugin: enhancementPlugin,
        };


        this._log.info('Registering portal app enhancement:', JSON.stringify({enhancement}));
        this._registry.registerPortalAppEnhancement(enhancement);
    }

    async unload(plugin: MashroomPlugin) {
        this._log.info(`Unregistering portal app enhancement: ${plugin.name}`);
        this._registry.unregisterPortalAppEnhancement(plugin.name);
    }
}
