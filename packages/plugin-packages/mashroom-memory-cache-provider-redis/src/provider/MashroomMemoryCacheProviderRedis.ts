
import getClient, {getKeyPrefix} from '../redis_client';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomMemoryCacheProvider, CacheValue, CacheKey} from '@mashroom/mashroom-memory-cache/type-definitions';
import type {IORedisClient} from '../../type-definitions';

export default class MashroomMemoryCacheProviderRedis implements MashroomMemoryCacheProvider {

    private _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.memorycache.redis');
    }

    async get(region: string, key: CacheKey): Promise<CacheValue | undefined> {
        return this._doWithClient<CacheValue>(async (client) => {
            const json = await client.get(this._getFullKey(region, key));
            if (json) {
                try {
                    return JSON.parse(json);
                } catch (e) {
                    this._logger.error('Parsing cache value failed!', e);
                }
            }
            return undefined;
        });
    }

    async set(region: string, key: CacheKey, value: CacheValue, ttlSec: number): Promise<void> {
        return this._doWithClient<void>(async (client) => {
            await client.set(this._getFullKey(region, key), JSON.stringify(value), 'EX', ttlSec);
        });
    }

    async del(region: string, key: CacheKey): Promise<void> {
        return this._doWithClient<void>(async (client) => {
            await client.del(this._getFullKey(region, key));
        });
    }

    async getEntryCount(region: string): Promise<number | undefined> {
        return this._doWithClient<number>(async (client) => {
            const keys = await client.keys(this._getRegionPattern(region));
            return keys.length;
        });
    }

    async clear(region: string): Promise<void> {
        return this._doWithClient<void>(async (client) => {
            const keys = await client.keys(this._getRegionPattern(region));
            if (keys && keys.length) {
                const keyPrefix = getKeyPrefix() || '';
                const keysWithoutPrefix = keys.map((k) => k.substr(keyPrefix.length));
                await client.del(...keysWithoutPrefix);
            }
        });
    }

    private _getFullKey(region: string, key: string): string {
        return `${region}:${key}`;
    }

    private _getRegionPattern(region: string): string {
        const keyPrefix = getKeyPrefix() || '';
        return `${keyPrefix}${region}:*`;
    }

    private async _doWithClient<T>(op: (client: IORedisClient) => Promise<T>): Promise<T | undefined> {
        try {
            const client = await getClient(this._logger);
            return await op(client);
        } catch (e) {
            this._logger.error('Redis operation failed. Memory cache is inactive!', e);
        }
        return undefined;
    }

}
