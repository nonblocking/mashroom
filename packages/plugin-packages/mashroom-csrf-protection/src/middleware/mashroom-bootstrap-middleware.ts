
import MashroomCSRFMiddleware from './MashroomCSRFMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {safeMethods} = pluginConfig;
    const middleware = new MashroomCSRFMiddleware(safeMethods);
    return middleware.middleware();
};

export default bootstrap;
