// @flow

import MashroomSessionMiddleware from './MashroomSessionMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const storeProvider = pluginConfig.provider;
    const options = Object.assign({}, pluginConfig.session);
    const middleware = new MashroomSessionMiddleware(storeProvider, options);
    return middleware.middleware();
};

export default bootstrap;
