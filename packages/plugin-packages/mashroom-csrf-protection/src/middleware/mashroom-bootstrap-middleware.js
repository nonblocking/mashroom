// @flow

import MashroomCSRFMiddleware from './MashroomCSRFMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {safeMethods} = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();
    const middleware = new MashroomCSRFMiddleware(safeMethods, pluginContext.loggerFactory);
    return middleware.middleware();
};

export default bootstrap;
