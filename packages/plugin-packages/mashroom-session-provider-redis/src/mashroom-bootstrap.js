// @flow

import {createClient} from 'redis';
import createRedisStore from 'connect-redis';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.session.provider.redis');
    logger.info('Using Redis client options:', pluginConfig);
    const client = createClient(pluginConfig);
    client.on('error', (err: any) => {
        logger.error('Redis store error:', err);
    });
    const options = {
        client,
    };
    const RedisStore = createRedisStore(expressSession);
    return new RedisStore(options);
};

export default bootstrap;
