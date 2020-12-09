
import MashroomErrorPagesMiddleware from './MashroomErrorPagesMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const context = contextHolder.getPluginContext();
    const {serverConfig} = context;
    const {mapping} = pluginConfig;
    const middleware = new MashroomErrorPagesMiddleware(serverConfig.serverRootFolder, mapping);
    return middleware.middleware();
};

export default bootstrap;
