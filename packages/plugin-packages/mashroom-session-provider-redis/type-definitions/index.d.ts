
import type {Redis, Cluster, ClusterNode, ClusterOptions, RedisOptions} from 'ioredis';

export type IORedisClient = Redis | Cluster;

export type IORedisConfig = {
    redisOptions: RedisOptions;
    cluster: boolean;
    clusterNodes: Array<ClusterNode>;
    clusterOptions: ClusterOptions;
}
