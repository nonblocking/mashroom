
import getClient, {getKeyPrefix} from './redis_client';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomMemoryCacheProvider, CacheValue, CacheKey} from '@mashroom/mashroom-memory-cache/type-definitions';
import {IORedisClient} from '../type-definitions';

export default class MashroomMemoryCacheProviderRedis implements MashroomMemoryCacheProvider {

    private logger: MashroomLogger;

    constructor(private loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.memorycache.redis');
    }

    async get(region: string, key: CacheKey): Promise<CacheValue | undefined> {
        return this.doWithClient<CacheValue>(async (client) => {
            const json = await client.get(this.getFullKey(region, key));
            if (json) {
                try {
                    return JSON.parse(json);
                } catch (e) {
                    this.logger.error('Parsing cache value failed!', e);
                }
            }
            return undefined;
        });
    }

    async set(region: string, key: CacheKey, value: CacheValue, ttlSec: number): Promise<void> {
        return this.doWithClient<void>(async (client) => {
            await client.set(this.getFullKey(region, key), JSON.stringify(value), 'ex', ttlSec);
        });
    }

    async del(region: string, key: CacheKey): Promise<void> {
        return this.doWithClient<void>(async (client) => {
            await client.del(this.getFullKey(region, key));
        });
    }

    async getEntryCount(region: string): Promise<number | undefined> {
        return this.doWithClient<number>(async (client) => {
            const keys = await client.keys(this.getRegionPattern(region));
            return keys.length;
        });
    }

    async clear(region: string): Promise<void> {
        return this.doWithClient<void>(async (client) => {
            const keys = await client.keys(this.getRegionPattern(region));
            if (keys && keys.length) {
                const keyPrefix = getKeyPrefix() || '';
                const keysWithoutPrefix = keys.map((k) => k.substr(keyPrefix.length));
                await client.del(...keysWithoutPrefix);
            }
        });
    }

    private getFullKey(region: string, key: string): string {
        return `${region}:${key}`;
    }

    private getRegionPattern(region: string): string {
        const keyPrefix = getKeyPrefix() || '';
        return `${keyPrefix}${region}:*`;
    }

    private async doWithClient<T>(op: (client: IORedisClient) => Promise<T>): Promise<T | undefined> {
        try {
            const client = await getClient();
            return await op(client);
        } catch (e) {
            this.logger.error('Redis operation failed. Memory cache is inactive!', e);
        }
        return undefined;
    }

}
