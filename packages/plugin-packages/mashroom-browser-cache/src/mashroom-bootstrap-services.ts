
import MashroomCacheControlService from './MashroomCacheControlService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {disabled, disabledWhenAuthenticated, maxAgeSec} = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();
    const {serverConfig, loggerFactory} = pluginContext;
    const devMode = serverConfig.pluginPackageFolders && serverConfig.pluginPackageFolders.some((ppf) => ppf.devMode);

    const cacheControl = new MashroomCacheControlService(devMode, disabled, disabledWhenAuthenticated, maxAgeSec, loggerFactory);

    return {
        cacheControl,
    };
};

export default bootstrap;
