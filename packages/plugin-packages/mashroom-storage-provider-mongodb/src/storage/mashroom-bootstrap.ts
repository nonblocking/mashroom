
import {setConnectionUriAndOptions, close} from '../mongodb';
import MashroomStorageMongoDB from './MashroomStorageMongoDB';
import {startExportStoreMetrics, stopExportStoreMetrics} from '../metrics/store_metrics';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const {uri, connectionOptions} = pluginConfig;

    await setConnectionUriAndOptions(uri, connectionOptions);

    startExportStoreMetrics(pluginContextHolder);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        close();
        stopExportStoreMetrics();
    });

    return new MashroomStorageMongoDB(pluginContext.loggerFactory);
};

export default bootstrap;
