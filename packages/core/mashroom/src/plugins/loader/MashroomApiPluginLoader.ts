
import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';

import type {Router, Application} from 'express';
import type {
    MashroomPluginContextHolder, MashroomPluginConfig,
    MashroomPlugin, MashroomApiPluginBootstrapFunction,
} from '../../../type-definitions';

export default class MashroomApiPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    addPluginInstance(expressApplication: Application, pluginInstance: Router, pluginConfig: MashroomPluginConfig) {
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
