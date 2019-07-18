// @flow

import MashroomSessionMiddleware from './MashroomSessionMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const storeProvider = pluginConfig.provider;
    const options = Object.assign({}, pluginConfig.session);
    const pluginContext = pluginContextHolder.getPluginContext();
    const middleware = new MashroomSessionMiddleware(storeProvider, options, pluginContext.loggerFactory);
    return middleware.middleware();
};

export default bootstrap;
