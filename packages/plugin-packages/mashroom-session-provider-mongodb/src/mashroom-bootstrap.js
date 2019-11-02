// @flow

import createMongoDBStore from 'connect-mongodb-session';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.session.provider.mongodb');
    logger.info('Using mongoDB connection options:', pluginConfig);
    const MongoDBStore = createMongoDBStore(expressSession);
    return new MongoDBStore(pluginConfig);
};

export default bootstrap;
