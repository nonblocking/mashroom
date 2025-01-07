
import Redis from 'ioredis';

import type {Redis as RedisType, Cluster} from 'ioredis';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {IORedisClient, IORedisConfig} from '../type-definitions';

// A Redis client cannot publish and subscribe at the same time
type Clients = {
    subscriberClient: IORedisClient | null;
    publisherClient: IORedisClient | null;
}

let _redisConfig: IORedisConfig | null = null;
const _clients: Clients = {
    subscriberClient: null,
    publisherClient: null,
};

export const close = async (): Promise<void> => {
    if (_clients.subscriberClient) {
        try {
            await _clients.subscriberClient.disconnect();
        } catch (e) {
            //ignore
        }
    }
    _clients.subscriberClient = null;
    if (_clients.publisherClient) {
        try {
            await _clients.publisherClient.disconnect();
        } catch (e) {
            //ignore
        }
    }
    _clients.publisherClient = null;
};

export const setConfig = async (redisConfig: IORedisConfig): Promise<void> => {
    await close();
    _redisConfig = redisConfig;
};

export const getAvailableNodes = () => {
    if (!_clients.subscriberClient) {
        return 0;
    }
    if ('status' in _clients.subscriberClient) {
        return (_clients.subscriberClient as RedisType).status === 'ready' ? 1 : 0;
    }
    const nodes = (_clients.subscriberClient as Cluster).nodes();
    return nodes.filter((redis) => redis.status === 'ready').length;
};

export const isConnected = () => {
    return getAvailableNodes() > 0;
};

export const getSubscriberClient = async (logger: MashroomLogger): Promise<IORedisClient> => {
    return getClient('subscriberClient', logger);
};

export const getPublisherClient = async (logger: MashroomLogger): Promise<IORedisClient> => {
    return getClient('publisherClient', logger);
};

const getClient = async (clientKey: keyof Clients, logger: MashroomLogger): Promise<IORedisClient> => {
    if (_clients[clientKey]) {
        return _clients[clientKey]!;
    }
    if (!_redisConfig) {
        throw new Error('No connection Redis config set!');
    }

    const {cluster, redisOptions, clusterNodes, clusterOptions} = _redisConfig;
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
        client.on('connect', () => {
            setTimeout(() => {
                resolved = true;
                resolve();
            }, 0);
        });
        setTimeout(() => {
            if (!resolved) {
                resolve();
            }
        }, 2000);
    });

    _clients[clientKey] = client;

    return client;
};

