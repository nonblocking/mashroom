// @flow

import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';

import type {
    MashroomPluginContextHolder, ExpressApplication, MashroomPluginConfig, MashroomWebAppPluginBootstrapFunction, MashroomPlugin, ExpressRequestHandler,
} from '../../../type-definitions';

export default class MashroomWebAppPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    addPluginInstance(expressApplication: ExpressApplication, pluginInstance: ExpressRequestHandler, pluginConfig: MashroomPluginConfig) {
        expressApplication.use(pluginConfig.path, pluginInstance);
    }

    async createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const webAppBootstrap: MashroomWebAppPluginBootstrapFunction = plugin.requireBootstrap();
        const webapp = await webAppBootstrap(plugin.name, pluginConfig, contextHolder);
        if (webapp && typeof(webapp.disable) === 'function') {
            webapp.disable('x-powered-by');
        }
        return webapp;
    }

    isMiddleware() {
        return false;
    }

    get name(): string {
        return 'WebApp Plugin Loader';
    }

}
