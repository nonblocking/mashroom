
import MashroomVHostPathMapperMiddleware from './MashroomVHostPathMapperMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const { hosts } = pluginConfig;
    const middleware = new MashroomVHostPathMapperMiddleware(hosts);
    return middleware.middleware();
};

export default bootstrap;
