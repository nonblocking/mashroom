
import context from '../context/global_context';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomMemoryCacheProvider,
    CacheKey,
    CacheValue,
} from '../../type-definitions';
import {CacheStatistics, MashroomMemoryCacheServiceWithStats} from '../../type-definitions/internal';

export default class MashroomMemoryCacheService implements MashroomMemoryCacheServiceWithStats {

    private _entriesAdded: number;
    private _cacheHits: number;
    private _cacheMisses: number;
    private _regions: Array<string>;
    private _logger: MashroomLogger;

    constructor(private _provider: string, private _defaultTTLSec: number, loggerFactory: MashroomLoggerFactory) {
        this._entriesAdded = 0;
        this._cacheHits = 0;
        this._cacheMisses = 0;
        this._regions = [];
        this._logger = loggerFactory('mashroom.memorycache');
    }

    async get(region: string, key: CacheKey): Promise<CacheValue | undefined> {
        const provider = this._getCacheProvider();
        if (provider) {
            const hit = await provider.get(region, key);
            if (hit) {
                this._cacheHits ++;
                return hit;
            }
            this._cacheMisses ++;
        }
        return undefined;
    }

    async set(region: string, key: CacheKey, value: CacheValue, ttlSec?: number): Promise<void> {
        const provider = this._getCacheProvider();
        if (provider) {
            this._entriesAdded ++;
            if (!this._regions.includes(region)) {
                this._regions.push(region);
            }
            await provider.set(region, key, value, ttlSec || this._defaultTTLSec);
        }
    }

    async del(region: string, key: CacheKey): Promise<void> {
        const provider = this._getCacheProvider();
        if (provider) {
            await provider.del(region, key);
        }
    }

    async clear(region: string): Promise<void> {
        const provider = this._getCacheProvider();
        if (provider) {
            await provider.clear(region);
        }
    }

    async getEntryCount(region: string): Promise<number | undefined> {
        const provider = this._getCacheProvider();
        if (provider) {
            return provider.getEntryCount(region);
        }
    }

    getStats(): CacheStatistics {
        const { _regions, _entriesAdded, _cacheHits, _cacheMisses } = this;
        const regionCount = _regions.length;
        const requestsTotal = _cacheHits + _cacheMisses;
        const cacheHitRatio = requestsTotal > 0 ? _cacheHits / requestsTotal : 0;
        return {
            regionCount,
            entriesAdded: _entriesAdded,
            cacheHitRatio,
        }
    }

    private _getCacheProvider(): MashroomMemoryCacheProvider | undefined {
        const provider = context.pluginRegistry.findProvider(this._provider);
        if (!provider) {
            this._logger.error(`Memory cache provider not found: ${this._provider}. Memory cache is inactive!`);
        }
        return provider;
    }

}
