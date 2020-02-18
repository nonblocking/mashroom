// @flow

import createMongoDBStore from 'connect-mongodb-session';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.session.provider.mongodb');
    const MongoDBStore = createMongoDBStore(expressSession);
    const store = new MongoDBStore(pluginConfig);
    store.on('error', (err: any) => {
        logger.error('MongoDB store error:', err);
    });
    return store;
};

export default bootstrap;
