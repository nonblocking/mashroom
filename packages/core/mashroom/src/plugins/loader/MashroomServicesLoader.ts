
import PluginConfigurationError from '@mashroom/mashroom-utils/lib/PluginConfigurationError';

import type {
    MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLoggerFactory,
    MashroomLogger, MashroomServicesPluginBootstrapFunction, MashroomServices,
} from '../../../type-definitions';
import type {
    MashroomServiceRegistry,
} from '../../../type-definitions/internal';

export default class MashroomServicesLoader implements MashroomPluginLoader {

    private logger: MashroomLogger;

    constructor(private _serviceRegistry: MashroomServiceRegistry, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.plugins.loader');
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const namespace = plugin.pluginDefinition.namespace;
        if (!namespace) {
            throw new PluginConfigurationError(`Cannot register services in ${plugin.name} because the 'namespace' attribute is missing!`);
        }
        const bootstrap: MashroomServicesPluginBootstrapFunction = plugin.requireBootstrap();
        const services: MashroomServices = await bootstrap(plugin.name, config, contextHolder);

        this.logger.info('Registering services:', namespace);
        this._serviceRegistry.registerServices(namespace, services);
    }

    async unload(plugin: MashroomPlugin) {
        const namespace = plugin.pluginDefinition.namespace;
        this.logger.info('Unregistering services:', namespace);
        this._serviceRegistry.unregisterServices(namespace);
    }

    get name(): string {
        return 'Services Plugin Loader';
    }

}
