// @flow

import type {
    MashroomPluginContextHolder, MashroomPluginLoader, MashroomPluginConfig, MashroomPlugin,
    MashroomMiddlewarePluginBootstrapFunction, MiddlewarePluginDelegate, MashroomLoggerFactory, MashroomLogger,
} from '../../../type-definitions';

const DEFAULT_ORDER = 1000;

export default class MashroomMiddlewarePluginLoader implements MashroomPluginLoader {

    _middlewarePluginDelegate: MiddlewarePluginDelegate;
    _log: MashroomLogger;

    constructor(middlewarePluginDelegate: MiddlewarePluginDelegate, loggerFactory: MashroomLoggerFactory) {
        this._middlewarePluginDelegate = middlewarePluginDelegate;
        this._log = loggerFactory('mashroom.plugins.loader');
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
        this._log.info(`Inserting middleware '${plugin.name}' with order: ${order}`);
        this._middlewarePluginDelegate.insertOrReplaceMiddleware(plugin.name, order, middleware);
    }

    async unload(plugin: MashroomPlugin) {
        this._log.info(`Removing middleware '${plugin.name}'`);
        this._middlewarePluginDelegate.removeMiddleware(plugin.name);
    }

    get name(): string {
        return 'Middleware Plugin Loader';
    }

}
