
import MashroomBackgroundJobService from './MashroomBackgroundJobService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const service = new MashroomBackgroundJobService(pluginContextHolder);

    return {
        service,
    };
};

export default bootstrap;
