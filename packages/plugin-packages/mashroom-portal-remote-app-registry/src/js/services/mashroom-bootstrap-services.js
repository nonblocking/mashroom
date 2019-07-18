// @flow

import MashroomPortalRemoteAppEndpointService from './MashroomPortalRemoteAppEndpointService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const service = new MashroomPortalRemoteAppEndpointService(pluginContextHolder);

    return {
        service,
    };
};

export default bootstrap;
