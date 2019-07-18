// @flow

import MashroomHttpProxyService from './MashroomHttpProxyService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {forwardMethods = [], forwardHeaders = [], rejectUntrustedCerts, poolMaxSockets, socketTimeoutMs } = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomHttpProxyService(forwardMethods, forwardHeaders, rejectUntrustedCerts, poolMaxSockets, socketTimeoutMs, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
