// @flow

import RegisterRequestGloballyMiddleware from './RegisterRequestGloballyMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const middleware = new RegisterRequestGloballyMiddleware(pluginContext.loggerFactory);
    return middleware.middleware();
};

export default bootstrap;
