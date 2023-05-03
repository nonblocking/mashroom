
import Redis from 'ioredis';

import type {Redis as RedisType, Cluster} from 'ioredis';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {IORedisClient, IORedisConfig} from '../type-definitions';

let _redisConfig: IORedisConfig | null = null;
let _subscriberClient: IORedisClient | null = null;
let _publisherClient: IORedisClient | null = null;

export const close = async (): Promise<void> => {
    if (_subscriberClient) {
        try {
            await _subscriberClient.disconnect();
        } catch (e) {
            //ignore
        }
    }
    _subscriberClient = null;
    if (_publisherClient) {
        try {
            await _publisherClient.disconnect();
        } catch (e) {
            //ignore
        }
    }
    _publisherClient = null;
};

export const setConfig = async (redisConfig: IORedisConfig): Promise<void> => {
    await close();
    _redisConfig = redisConfig;
};

export const getAvailableNodes = () => {
    if (!_subscriberClient) {
        return 0;
    }
    if (_subscriberClient.hasOwnProperty('status')) {
        return (_subscriberClient as RedisType).status === 'ready' ? 1 : 0;
    }
    const nodes = (_subscriberClient as Cluster).nodes();
    return nodes.filter((redis) => redis.status === 'ready').length;
};

export const isConnected = () => {
    return getAvailableNodes() > 0;
};

export const getSubscriberClient = async (logger: MashroomLogger): Promise<IORedisClient> => {
    return getClient(_subscriberClient, logger);
};

export const getPublisherClient = async (logger: MashroomLogger): Promise<IORedisClient> => {
    return getClient(_subscriberClient, logger);
};

const getClient = async (client: IORedisClient | null ,logger: MashroomLogger): Promise<IORedisClient> => {
    if (client) {
        return client;
    }
    if (!_redisConfig) {
        throw new Error('No connection Redis config set!');
    }

    const {cluster, redisOptions, clusterNodes, clusterOptions} = _redisConfig;
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

    client.on('reconnecting', () => {
        logger.warn('Reconnecting to Redis...');
    });
    client.on('error', (err: any) => {
        logger.error('Redis client error:', err);
    });
    client.on('node error', (err: any, address: string) => {
        logger.error('Redis cluster node error:', address, err);
    });

    // Wait for a connection a few seconds
    await new Promise<void>((resolve) => {
        let resolved = false;
        client && client.on('connect', () => {
            setTimeout(() => {
                resolved = true;
                resolve();
            }, 0);
        });
        setTimeout(() => {
            !resolved && resolve();
        }, 2000);
    });

    return client;
};

