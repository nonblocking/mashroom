import AddAccessTokenHttpProxyInterceptor from './AddAccessTokenHttpProxyInterceptor';

import type {MashroomHttpProxyInterceptorPluginBootstrapFunction} from '@mashroom/mashroom-http-proxy/type-definitions';

const bootstrap: MashroomHttpProxyInterceptorPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {addBearer, accessTokenHeader, targetUris} = pluginConfig;
    return new AddAccessTokenHttpProxyInterceptor(addBearer, accessTokenHeader, targetUris);
};

export default bootstrap;
