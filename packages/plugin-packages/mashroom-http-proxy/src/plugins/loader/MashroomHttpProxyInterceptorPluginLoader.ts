
import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomHttpProxyInterceptor,
    MashroomHttpProxyInterceptorPluginBootstrapFunction,
} from '../../../type-definitions';
import type {MashroomHttpProxyInterceptorRegistry} from '../../../type-definitions/internal';

const DEFAULT_ORDER = 1000;

export default class MashroomHttpProxyInterceptorPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomHttpProxyInterceptorRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.httpProxy.plugin.loader');
    }

    get name(): string {
        return 'Http Proxy Interceptor Plugin Loader';
    }

    generateMinimumConfig(): MashroomPluginConfig {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const bootstrap: MashroomHttpProxyInterceptorPluginBootstrapFunction = plugin.requireBootstrap();
        const interceptor: MashroomHttpProxyInterceptor = await bootstrap(plugin.name, config, contextHolder);
        const order = config.order || DEFAULT_ORDER;
        this._logger.info(`Registering http proxy interceptor plugin: ${plugin.name} (with order: ${order})`);
        this._registry.register(order, plugin.name, interceptor);
    }

    async unload(plugin: MashroomPlugin): Promise<void>  {
        this._logger.info(`Unregistering http proxy interceptor plugin: ${plugin.name}`);
        this._registry.unregister(plugin.name);
    }
}
