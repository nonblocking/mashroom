
import createMongoDBStore from 'connect-mongodb-session';

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

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        store.client.close();
    });

    return store;
};

export default bootstrap;
