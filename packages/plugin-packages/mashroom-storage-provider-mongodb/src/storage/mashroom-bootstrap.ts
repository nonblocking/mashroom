
import {setConnectionUriAndOptions, close} from '../mongodb';
import healthProbe from '../health/health_probe';
import {startExportStoreMetrics, stopExportStoreMetrics} from '../metrics/store_metrics';
import MashroomStorageMongoDB from './MashroomStorageMongoDB';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();
    const {uri, connectionOptions} = pluginConfig;

    await setConnectionUriAndOptions(uri, connectionOptions);

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
