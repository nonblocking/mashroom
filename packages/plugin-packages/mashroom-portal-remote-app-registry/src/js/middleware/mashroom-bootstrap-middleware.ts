
import RegisterRequestGloballyMiddleware from './RegisterRequestGloballyMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const middleware = new RegisterRequestGloballyMiddleware();
    return middleware.middleware();
};

export default bootstrap;
