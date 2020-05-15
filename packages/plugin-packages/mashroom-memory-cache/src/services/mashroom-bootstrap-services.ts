
import MashroomMemoryCacheService from './MashroomMemoryCacheService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {provider, defaultTTLSec} = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const service = new MashroomMemoryCacheService(provider, defaultTTLSec, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
