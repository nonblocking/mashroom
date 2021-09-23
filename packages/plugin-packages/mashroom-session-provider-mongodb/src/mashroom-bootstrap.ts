
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
    store.on('error', (err: any) => {
        logger.error('MongoDB store error:', err);
    });

    // Redirect MongoDB logger
    Logger.setLevel('info');
    Logger.setCurrentLogger((msg, context) => {
        if (context && context.type === 'info') {
            logger.info('MongoDB:', msg);
        } else {
            logger.error('MongoDB:', msg);
        }
    });

    const client = store.client;
    let connected = false;
    client.on('open', () => {
        logger.info('MongoDB: Connection opened');
        connected = true;
    });
    client.on('close', () => {
        logger.info('MongoDB: Connection closed');
        connected = false;
    });
    client.on('error', (event) => {
        logger.error('MongoDB: Error:', event);
    });

    client.on('serverDescriptionChanged', (event) => {
        logger.debug('MongoDB:', event);
    });
    client.on('serverHeartbeatSucceeded', (event) => {
        if (!connected) {
            connected = true;
            logger.info('MongoDB: Reconnected to cluster: ', event);
        } else {
            logger.debug('MongoDB:', event);
        }
    });
    client.on('serverHeartbeatFailed', (event) => {
        logger.error('MongoDB: Disconnected from cluster: ', event);
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
