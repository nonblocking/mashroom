
import {removeFromExpressStack} from '../../../utils/reload-utils';
import ExpressRequestHandlerWrapper from './ExpressRequestHandlerWrapper';

import type {RequestHandler, Application} from 'express';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomPluginLoader,
} from '../../../../type-definitions';

type LoadedPlugin = {
    readonly path: string,
    readonly requestHandlerWrapper: ExpressRequestHandlerWrapper
}

export default abstract class ExpressRequestHandlerBasePluginLoader implements MashroomPluginLoader {

    private readonly _logger: MashroomLogger;
    private readonly _loadedPlugins: Map<string, LoadedPlugin>;

    constructor(private _expressApplication: Application, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.loader');
        this._loadedPlugins = new Map();
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        const requirePath = !this.isMiddleware();
        if (requirePath) {
            return {
                path: `/${plugin.name}`,
            };
        }
        return {};
    }

    async load(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const requirePath = !this.isMiddleware();
        if (requirePath) {
            if (!pluginConfig.path.startsWith('/')) {
                pluginConfig.path = `/${pluginConfig.path}`;
            }
        }

        const loadedPlugin = this._getLoadedPlugin(plugin);
        let requestHandlerWrapper;

        if (!loadedPlugin) {
            this._logger.info(`Adding ${plugin.type} express plugin ${plugin.name}${requirePath ? ` to path: ${pluginConfig.path}` : ''}`);
            requestHandlerWrapper = new ExpressRequestHandlerWrapper(plugin.name);
            this.addPluginInstance(this._expressApplication, requestHandlerWrapper.handler(), pluginConfig);
        } else {
            this._logger.info(`Updating ${plugin.type} express plugin ${plugin.name}${requirePath ? ` on path: ${pluginConfig.path}` : ''}`);
            this.beforeUnload(plugin);
            requestHandlerWrapper = loadedPlugin.requestHandlerWrapper;

            if (requirePath && pluginConfig.path !== loadedPlugin.path) {
                this._logger.info(`Moving ${plugin.type} express plugin ${plugin.name} to new path: ${pluginConfig.path} (from: ${loadedPlugin.path})`);
                removeFromExpressStack(this._expressApplication, plugin);
                this.addPluginInstance(this._expressApplication, requestHandlerWrapper.handler(), pluginConfig);
            }
        }

        const pluginInstance = await this.createPluginInstance(plugin, pluginConfig, contextHolder);
        requestHandlerWrapper.updateRequestHandler(pluginInstance);

        this._loadedPlugins.set(plugin.name, {
            path: pluginConfig.path,
            requestHandlerWrapper,
        });
    }

    async unload(plugin: MashroomPlugin) {
        const requirePath = !this.isMiddleware();
        const loadedPlugin = this._getLoadedPlugin(plugin);
        if (loadedPlugin) {
            this._logger.info(`Removing ${plugin.type} express plugin ${plugin.name}${requirePath ? ` from path: ${loadedPlugin.path}` : ''}`);
            this.beforeUnload(plugin);
            removeFromExpressStack(this._expressApplication, plugin);
            this._loadedPlugins.delete(plugin.name);
        }
    }

    private _getLoadedPlugin(plugin: MashroomPlugin): LoadedPlugin | undefined | null {
        return this._loadedPlugins.get(plugin.name);
    }

    abstract addPluginInstance(expressApplication: Application, pluginInstance: RequestHandler, pluginConfig: MashroomPluginConfig): void;

    abstract createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<RequestHandler>;

    abstract isMiddleware(): boolean;

    beforeUnload(plugin: MashroomPlugin) {
        // Empty hook
    }

    abstract get name(): string;

}
