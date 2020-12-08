
import MashroomCacheControlService from './MashroomCacheControlService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {disabled, maxAgeSec} = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();
    const {serverInfo, loggerFactory} = pluginContext;
    const devMode = serverInfo.devMode;

    const cacheControl = new MashroomCacheControlService(devMode, disabled, maxAgeSec, loggerFactory);

    return {
        cacheControl,
    };
};

export default bootstrap;
