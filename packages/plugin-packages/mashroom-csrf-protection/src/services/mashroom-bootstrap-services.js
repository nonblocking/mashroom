// @flow

import MashroomCSRFService from './MashroomCSRFService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {saltLength, secretLength} = pluginConfig;

    const service = new MashroomCSRFService(saltLength, secretLength);

    return {
        service,
    };
};

export default bootstrap;
