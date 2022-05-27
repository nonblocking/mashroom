
import Redis from 'ioredis';

import type {Redis as RedisType, Cluster} from 'ioredis';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {IORedisClient, IORedisConfig} from '../type-definitions';

let _redisConfig: IORedisConfig | null = null;
let _client: IORedisClient | null = null;

export const close = async (): Promise<void> => {
    if (_client) {
        try {
            await _client.disconnect();
        } catch (e) {
            //ignore
        }
    }
    _client = null;
};

export const setConfig = async (redisConfig: IORedisConfig): Promise<void> => {
    await close();
    _redisConfig = redisConfig;
};

export const getKeyPrefix = (): string | null | undefined => {
    return _redisConfig && _redisConfig.redisOptions && _redisConfig.redisOptions.keyPrefix;
};

export const getAvailableNodes = () => {
    if (!_client) {
        return 0;
    }
    if (_client.hasOwnProperty('status')) {
        return (_client as RedisType).status === 'ready' ? 1 : 0;
    }
    const nodes = (_client as Cluster).nodes();
    return nodes.filter((redis) => redis.status === 'ready').length;
};

export const isConnected = () => {
    return getAvailableNodes() > 0;
};

export default async (logger: MashroomLogger): Promise<IORedisClient> => {
    if (_client) {
        return _client;
    }
    if (!_redisConfig) {
        throw new Error('No connection Redis config set!');
    }

    const {cluster, redisOptions, clusterNodes, clusterOptions} = _redisConfig;
    if (!cluster) {
        _client = new Redis(redisOptions);
    } else {
        delete redisOptions.host;
        delete redisOptions.port;
        _client = new Redis.Cluster(clusterNodes, {
            ...clusterOptions,
            redisOptions,
        });
    }

    _client.on('error', (err: any) => {
        logger.error('Redis client error:', err);
    });

    // Wait for a connection a few seconds
    await new Promise<void>((resolve) => {
        let resolved = false;
        _client && _client.on('connect', () => {
            setTimeout(() => {
                resolved = true;
                resolve();
            }, 0);
        });
        setTimeout(() => {
            !resolved && resolve();
        }, 2000);
    });

    return _client;
};

