
import MongoDbStore from 'connect-mongo';
import createClient, {setConnectionUriAndOptions} from './mongodb';
import healthProbe from './health/health-probe';
import {registerStoreMetrics, unregisterStoreMetrics} from './metrics/store-metrics';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();
    const logger = loggerFactory('mashroom.session.provider.mongodb');
    const {client: {uri, connectionOptions}, ...connectMongoOptions} = pluginConfig;

    logger.info('Using collection for sessions:', connectMongoOptions.collectionName);

    await setConnectionUriAndOptions(uri, connectionOptions);
    const clientPromise = createClient(logger);

    const store = MongoDbStore.create({
        clientPromise,
        ...connectMongoOptions,
    });

    healthProbeService.registerProbe(pluginName, healthProbe);
    registerStoreMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        store.close();
        healthProbeService.unregisterProbe(pluginName);
        unregisterStoreMetrics();
    });

    return store;
};

export default bootstrap;
