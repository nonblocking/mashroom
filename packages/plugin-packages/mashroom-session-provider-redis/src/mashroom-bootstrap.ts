
import Redis from 'ioredis';
import createRedisStore from 'connect-redis';

import type {RedisOptions} from 'ioredis';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.session.provider.redis');

    const { redisOptions: options, cluster, clusterNodes, clusterOptions } = pluginConfig;
    const redisOptions: RedisOptions = options;

    let client: any;
    if (!cluster) {
        client = new Redis(redisOptions);
    } else {
        delete redisOptions.host;
        delete redisOptions.port;
        client = new Redis.Cluster(clusterNodes, Object.assign({}, clusterOptions, {
            redisOptions,
        }));
    }

    client.on('error', (err: any) => {
        logger.error('Redis store error:', err);
    });

    const RedisStore = createRedisStore(expressSession);
    return new RedisStore({
        client,
    });
};

export default bootstrap;
