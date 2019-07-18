// @flow

import MashroomSecurityMiddleware from './MashroomSecurityMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const middleware = new MashroomSecurityMiddleware(pluginContext.loggerFactory);
    return middleware.middleware();
};

export default bootstrap;
