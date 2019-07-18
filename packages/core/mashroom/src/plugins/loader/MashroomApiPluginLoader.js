// @flow

import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';

import type {
    MashroomPluginContextHolder, ExpressApplication, MashroomPluginConfig,
    MashroomPlugin, ExpressRequestHandler, MashroomApiPluginBootstrapFunction,
} from '../../../type-definitions';

export default class MashroomApiPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    addPluginInstance(expressApplication: ExpressApplication, pluginInstance: ExpressRequestHandler, pluginConfig: MashroomPluginConfig) {
        expressApplication.use(pluginConfig.path, pluginInstance);
    }

    async createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const apiBootstrap: MashroomApiPluginBootstrapFunction = plugin.requireBootstrap();
        return apiBootstrap(plugin.name, pluginConfig, contextHolder);
    }

    isMiddleware() {
        return false;
    }

    get name(): string {
        return 'API Plugin Loader';
    }

}
