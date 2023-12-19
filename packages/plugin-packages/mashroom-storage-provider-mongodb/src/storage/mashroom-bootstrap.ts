
import {setConnectionUriAndOptions, close, getDb} from '../mongodb';
import healthProbe from '../health/health-probe';
import {startExportStoreMetrics, stopExportStoreMetrics} from '../metrics/store-metrics';
import MashroomStorageMongoDB from './MashroomStorageMongoDB';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();
    const {uri, connectionOptions} = pluginConfig;

    // Set config and establish connection
    await setConnectionUriAndOptions(uri, connectionOptions);
    const logger = loggerFactory('mashroom.storage.mongodb');
    try {
        await getDb(logger);
    } catch {
        // Ignore
    }

    healthProbeService.registerProbe(pluginName, healthProbe);
    startExportStoreMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        close();
        healthProbeService.unregisterProbe(pluginName);
        stopExportStoreMetrics();
    });

    return new MashroomStorageMongoDB(loggerFactory);
};

export default bootstrap;
