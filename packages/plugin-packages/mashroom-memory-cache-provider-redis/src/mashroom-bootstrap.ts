
import {setConfig, close} from './redis_client';
import MashroomMemoryCacheProviderRedis from './MashroomMemoryCacheProviderRedis';

import type {MashroomMemoryCacheProviderPluginBootstrapFunction} from '@mashroom/mashroom-memory-cache/type-definitions';

const bootstrap: MashroomMemoryCacheProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext =  pluginContextHolder.getPluginContext();
    const loggerFactory = pluginContextHolder.getPluginContext().loggerFactory;

    const config: any = {
        ...pluginConfig,
        loggerFactory,
    }

    await setConfig(config);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        close();
    });

    return new MashroomMemoryCacheProviderRedis(loggerFactory);
};

export default bootstrap;
