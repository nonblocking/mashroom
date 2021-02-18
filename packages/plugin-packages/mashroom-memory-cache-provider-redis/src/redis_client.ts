
import Redis from 'ioredis';

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
}

export default async (): Promise<IORedisClient> => {
    if (_client) {
        return _client;
    }
    if (!_redisConfig) {
        throw new Error('No connection Redis config set!');
    }

    const {cluster, redisOptions, clusterNodes, clusterOptions, loggerFactory} = _redisConfig;
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

    const logger = loggerFactory('mashroom.memorycache.redis');
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

