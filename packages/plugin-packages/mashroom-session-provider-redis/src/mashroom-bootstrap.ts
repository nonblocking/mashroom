
import Redis from 'ioredis';
import createRedisStore from 'connect-redis';

import type {Redis as RedisClient, Cluster, RedisOptions, ClusterNode, ClusterOptions} from 'ioredis';
import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

type IORedisClient = RedisClient | Cluster;

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const pluginContext =  pluginContextHolder.getPluginContext();
    const logger = pluginContext.loggerFactory('mashroom.session.provider.redis');

    const redisOptions: RedisOptions = pluginConfig.redisOptions;
    const cluster: boolean = pluginConfig.cluster;
    const clusterNodes: Array<ClusterNode> = pluginConfig.clusterNodes;
    const clusterOptions: ClusterOptions = pluginConfig.clusterOptions;

    let client: IORedisClient;
    if (!cluster) {
        client = new Redis(redisOptions);
    } else {
        delete redisOptions.host;
        delete redisOptions.port;
        client = new Redis.Cluster(clusterNodes, {
            ...clusterOptions,
            redisOptions,
        });
    }

    client.on('error', (err: any) => {
        logger.error('Redis store error:', err);
    });

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        client.disconnect();
    });

    const RedisStore = createRedisStore(expressSession);
    return new RedisStore({
        // @ts-ignore
        client,
    });
};

export default bootstrap;
