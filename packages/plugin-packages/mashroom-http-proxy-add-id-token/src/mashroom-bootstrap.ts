import AddIdTokenHttpProxyInterceptor from './AddIdTokenHttpProxyInterceptor';

import type {MashroomHttpProxyInterceptorPluginBootstrapFunction} from '@mashroom/mashroom-http-proxy/type-definitions';

const bootstrap: MashroomHttpProxyInterceptorPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {addBearer, idTokenHeader, targetUris} = pluginConfig;
    return new AddIdTokenHttpProxyInterceptor(addBearer, idTokenHeader, targetUris);
};

export default bootstrap;
