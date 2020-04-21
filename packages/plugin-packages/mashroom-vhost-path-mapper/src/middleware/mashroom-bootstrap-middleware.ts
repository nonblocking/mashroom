
import MashroomVHostPathMapperMiddleware from './MashroomVHostPathMapperMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const { considerHttpHeaders, hosts } = pluginConfig;
    const middleware = new MashroomVHostPathMapperMiddleware(considerHttpHeaders, hosts);
    return middleware.middleware();
};

export default bootstrap;
