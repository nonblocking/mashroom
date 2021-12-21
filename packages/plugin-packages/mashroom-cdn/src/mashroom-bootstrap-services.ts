
import MashroomCDNService from './MashroomCDNService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {cdnHosts} = pluginConfig;
    const {loggerFactory} = pluginContextHolder.getPluginContext();

    const service = new MashroomCDNService(cdnHosts, loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
