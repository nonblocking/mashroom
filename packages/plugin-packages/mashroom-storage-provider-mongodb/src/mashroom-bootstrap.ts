
import {setConnectionUriAndOptions, close} from './mongodb_client';
import MashroomStorageMongoDB from './MashroomStorageMongoDB';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const {uri, connectionOptions} = pluginConfig;

    await setConnectionUriAndOptions(uri, connectionOptions);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        close();
    });

    return new MashroomStorageMongoDB(pluginContext.loggerFactory);
};

export default bootstrap;
