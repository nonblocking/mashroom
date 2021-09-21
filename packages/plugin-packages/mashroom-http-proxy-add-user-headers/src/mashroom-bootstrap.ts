import AddUserDataHttpProxyInterceptor from './AddUserHeadersHttpProxyInterceptor';

import type {MashroomHttpProxyInterceptorPluginBootstrapFunction} from '@mashroom/mashroom-http-proxy/type-definitions';

const bootstrap: MashroomHttpProxyInterceptorPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {userNameHeader, displayNameHeader, emailHeader, extraDataHeaders, targetUris} = pluginConfig;
    return new AddUserDataHttpProxyInterceptor(userNameHeader, displayNameHeader, emailHeader, extraDataHeaders, targetUris);
};

export default bootstrap;
