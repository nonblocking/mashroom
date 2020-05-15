// @flow

import {removeFromExpressStack} from '../../utils/reload_utils';
import ExpressRequestHandlerWrapper from './ExpressRequestHandlerWrapper';

import type {
    ExpressApplication,
    ExpressRequestHandler,
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomPluginLoader,
} from '../../../type-definitions';

type LoadedPlugin = {
    path: string,
    requestHandlerWrapper: ExpressRequestHandlerWrapper
}

export default class ExpressRequestHandlerBasePluginLoader implements MashroomPluginLoader {

    _log: MashroomLogger;
    _expressApplication: ExpressApplication;
    _loadedPlugins: Map<string, LoadedPlugin>;

    constructor(expressApplication: ExpressApplication, loggerFactory: MashroomLoggerFactory) {
        this._expressApplication = expressApplication;
        this._log = loggerFactory('mashroom.plugins.loader');

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
        let requestHandlerWrapper = null;

        if (!loadedPlugin) {
            this._log.info(`Adding ${plugin.type} express plugin ${plugin.name}${requirePath ? ` to path: ${pluginConfig.path}` : ''}`);
            requestHandlerWrapper = new ExpressRequestHandlerWrapper(plugin.name);
            this.addPluginInstance(this._expressApplication, requestHandlerWrapper.handler(), pluginConfig);
        } else {
            this._log.info(`Updating ${plugin.type} express plugin ${plugin.name}${requirePath ? ` on path: ${pluginConfig.path}` : ''}`);
            this.beforeUnload(plugin);
            requestHandlerWrapper = loadedPlugin.requestHandlerWrapper;

            if (requirePath && pluginConfig.path !== loadedPlugin.path) {
                this._log.info(`Moving ${plugin.type} express plugin ${plugin.name} to new path: ${pluginConfig.path} (from: ${loadedPlugin.path})`);
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
            this._log.info(`Removing ${plugin.type} express plugin ${plugin.name}${requirePath ? ` from path: ${loadedPlugin.path}` : ''}`);
            this.beforeUnload(plugin);
            removeFromExpressStack(this._expressApplication, plugin);
            this._loadedPlugins.delete(plugin.name);
        }
    }

    _getLoadedPlugin(plugin: MashroomPlugin): ?LoadedPlugin {
        return this._loadedPlugins.get(plugin.name);
    }

    addPluginInstance(expressApplication: ExpressApplication, pluginInstance: ExpressRequestHandler, pluginConfig: MashroomPluginConfig) {
        throw new Error('Not implemented');
    }

    createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<ExpressRequestHandler> {
        throw new Error('Not implemented');
    }

    isMiddleware() {
        throw new Error('Not implemented');
    }

    beforeUnload(plugin: MashroomPlugin) {
        // Empty hook
    }

    get name(): string {
        throw new Error('Not implemented');
    }

}
