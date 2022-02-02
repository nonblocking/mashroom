
import context from '../context';
import MashroomVHostPathMapperMiddleware from './MashroomVHostPathMapperMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const { considerHttpHeaders, hosts } = pluginConfig;
    context.considerHttpHeaders = considerHttpHeaders;
    context.vhostDefinitions = hosts;
    const middleware = new MashroomVHostPathMapperMiddleware();
    return middleware.middleware();
};

export default bootstrap;
