// @flow

import type {MashroomLogger, MashroomLoggerFactory, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomPluginLoader} from '@mashroom/mashroom/type-definitions';
import type {MashroomRemotePortalAppRegistryBootstrapFunction} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry, MashroomRemotePortalAppRegistryHolder} from '../../../../type-definitions/internal';

export default class PortalRemotePortalAppRegistryPluginLoader implements MashroomPluginLoader {

    _registry: MashroomPortalPluginRegistry;
    _log: MashroomLogger;

    constructor(registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._registry = registry;
        this._log = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal Remote Portal App Registry Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {
            priority: 1
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const bootstrap: MashroomRemotePortalAppRegistryBootstrapFunction = plugin.requireBootstrap();
        const registry = await bootstrap(plugin.name, config, contextHolder);

        const { priority } = config;

        const registryHolder: MashroomRemotePortalAppRegistryHolder = {
            name: plugin.name,
            registry,
            priority
        };

        this._log.info('Registering remote portal app registry:', {registry: registryHolder});
        this._registry.registerRemotePortalAppRegistry(registryHolder);
    }

    async unload(plugin: MashroomPlugin) {
        this._log.info(`Unregistering remote portal app registry: ${plugin.name}`);
        this._registry.unregisterRemotePortalAppRegistry(plugin.name);
    }
}
