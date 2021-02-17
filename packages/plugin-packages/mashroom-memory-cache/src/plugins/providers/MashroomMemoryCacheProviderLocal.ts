
import NodeCache from 'node-cache';

import type {MashroomMemoryCacheProvider, CacheValue, CacheKey} from '../../../type-definitions';

type CacheRegions = {
    [name: string]: NodeCache;
}

export default class MashroomMemoryCacheProviderLocal implements  MashroomMemoryCacheProvider {

    private readonly _cacheRegions: CacheRegions;

    constructor() {
        this._cacheRegions = {};
    }

    async get(region: string, key: CacheKey): Promise<CacheValue | undefined> {
        return this._getOrCreateCache(region).get(key);
    }

    async set(region: string, key: CacheKey, value: CacheValue, ttlSec: number): Promise<void> {
        this._getOrCreateCache(region).set(key, value, ttlSec);
    }

    async del(region: string, key: CacheKey): Promise<void> {
        this._getOrCreateCache(region).del(key);
    }

    async getEntryCount(region: string): Promise<number | undefined> {
        return this._getOrCreateCache(region).keys().length;
    }

    async clear(region: string): Promise<void> {
        this._getOrCreateCache(region).flushAll();
    }

    private _getOrCreateCache(region: string): NodeCache {
        let cache = this._cacheRegions[region];
        if (!cache) {
            cache = new NodeCache({
                stdTTL: 0,
                checkperiod: 0,
                useClones: true,
                deleteOnExpire: true,
                maxKeys: -1,
            });
            this._cacheRegions[region] = cache;
        }
        return cache;
    }

}
