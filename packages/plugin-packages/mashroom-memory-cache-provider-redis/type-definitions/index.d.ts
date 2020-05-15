
import {Redis, Cluster, ClusterNode, ClusterOptions, RedisOptions} from 'ioredis';
import {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';

export type IORedisClient = Redis | Cluster;

export type IORedisConfig = {
    redisOptions: RedisOptions;
    cluster: boolean;
    clusterNodes: Array<ClusterNode>;
    clusterOptions: ClusterOptions;
    loggerFactory: MashroomLoggerFactory;
}
