
import type {MashroomMessagingExternalProvider} from '@mashroom/mashroom-messaging/type-definitions';

import type {Redis, Cluster, ClusterNode, ClusterOptions, RedisOptions} from 'ioredis';

export type IORedisClient = Redis | Cluster;

export type IORedisConfig = {
    redisOptions: RedisOptions;
    cluster: boolean;
    clusterNodes: Array<ClusterNode>;
    clusterOptions: ClusterOptions;
}

export interface MashroomMessagingExternalProviderRedis extends MashroomMessagingExternalProvider {
    start(): Promise<void>;
    shutdown(): Promise<void>;
}
