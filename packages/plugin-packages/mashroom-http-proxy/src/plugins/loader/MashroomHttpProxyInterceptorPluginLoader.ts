
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

export default class MashroomHttpProxyInterceptorPluginLoader implements MashroomPluginLoader {

    private log: MashroomLogger;

    constructor(private registry: MashroomHttpProxyInterceptorRegistry, loggerFactory: MashroomLoggerFactory) {
        this.log = loggerFactory('mashroom.httpProxy.plugin.loader');
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
        this.log.info(`Registering http proxy interceptor plugin: ${plugin.name}`);
        this.registry.register(plugin.name, interceptor);
    }

    async unload(plugin: MashroomPlugin): Promise<void>  {
        this.log.info(`Unregistering http proxy interceptor plugin: ${plugin.name}`);
        this.registry.unregister(plugin.name);
    }
}
