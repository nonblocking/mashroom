
import {Logger} from 'mongodb';
import createMongoDBStore from 'connect-mongodb-session';
import {startExportStoreMetrics, stopExportStoreMetrics} from './metrics/store_metrics';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.session.provider.mongodb');
    const connectionInfo: any = pluginConfig;

    const MongoDBStore = createMongoDBStore(expressSession);
    const store = new MongoDBStore(connectionInfo);

    // Redirect MongoDB logger
    Logger.setLevel('info');
    Logger.setCurrentLogger((msg, context) => {
        if (context && context.type === 'info') {
            logger.info('MongoDB:', msg);
        } else {
            logger.error('MongoDB:', msg);
        }
    });

    let connected = false;
    store.on('connected', () => {
        logger.info('MongoDB connected');
        connected = true;
    });
    store.on('error', (event) => {
        logger.error('MongoDB error:', event);
        connected = false;
    });

    startExportStoreMetrics(() => connected, pluginContextHolder);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        store.client.close();
        stopExportStoreMetrics();
    });

    return store;
};

export default bootstrap;
