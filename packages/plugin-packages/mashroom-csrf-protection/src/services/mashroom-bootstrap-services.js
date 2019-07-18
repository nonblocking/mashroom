// @flow

import MashroomCSRFService from './MashroomCSRFService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {saltLength, secretLength} = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomCSRFService(saltLength, secretLength, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
