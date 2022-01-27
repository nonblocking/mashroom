
import MongoDbStore from 'connect-mongo';
import createClient, {setConnectionUriAndOptions} from './mongodb';
import healthProbe from './health/health_probe';
import {startExportStoreMetrics, stopExportStoreMetrics} from './metrics/store_metrics';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();
    const logger = loggerFactory('mashroom.session.provider.mongodb');
    const {uri, collection, connectionOptions} = pluginConfig;

    logger.info('Using session collection:', collection);

    await setConnectionUriAndOptions(uri, connectionOptions);
    const clientPromise = createClient(logger);

    const store = MongoDbStore.create({
        clientPromise,
        collectionName: collection,
    });

    healthProbeService.registerProbe(pluginName, healthProbe);
    startExportStoreMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        store.close();
        healthProbeService.unregisterProbe(pluginName);
        stopExportStoreMetrics();
    });

    return store;
};

export default bootstrap;
