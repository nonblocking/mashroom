
import type {
    MashroomPluginContextHolder, MashroomPluginLoader, MashroomPluginConfig, MashroomPlugin,
    MashroomMiddlewarePluginBootstrapFunction, MashroomLoggerFactory, MashroomLogger,
} from '../../../type-definitions';
import type {
    MiddlewarePluginDelegate
} from '../../../type-definitions/internal';

const DEFAULT_ORDER = 1000;

export default class MashroomMiddlewarePluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _middlewarePluginDelegate: MiddlewarePluginDelegate, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.loader');
    }

    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig {
        return {
            order: DEFAULT_ORDER,
        };
    }

    async load(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const order = pluginConfig.order;
        const middlewareBootstrap: MashroomMiddlewarePluginBootstrapFunction = plugin.requireBootstrap();
        const middleware = await middlewareBootstrap(plugin.name, pluginConfig, contextHolder);
        this._logger.info(`Inserting middleware '${plugin.name}' with order: ${order}`);
        this._middlewarePluginDelegate.insertOrReplaceMiddleware(plugin.name, order, middleware);
    }

    async unload(plugin: MashroomPlugin) {
        this._logger.info(`Removing middleware '${plugin.name}'`);
        this._middlewarePluginDelegate.removeMiddleware(plugin.name);
    }

    get name(): string {
        return 'Middleware Plugin Loader';
    }

}
