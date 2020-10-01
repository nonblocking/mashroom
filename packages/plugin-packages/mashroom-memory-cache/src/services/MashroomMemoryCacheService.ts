
import context from '../context/global_context';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomMemoryCacheProvider,
    CacheKey,
    CacheValue,
} from '../../type-definitions';
import {CacheStatistics, MashroomMemoryCacheServiceWithStats} from '../../type-definitions/internal';

export default class MashroomMemoryCacheService implements MashroomMemoryCacheServiceWithStats {

    private entriesAdded: number;
    private cacheHits: number;
    private cacheMisses: number;
    private regions: Array<string>;
    private logger: MashroomLogger;

    constructor(private provider: string, private defaultTTLSec: number, private loggerFactory: MashroomLoggerFactory) {
        this.entriesAdded = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.regions = [];
        this.logger = loggerFactory('mashroom.memorycache');
    }

    async get(region: string, key: CacheKey): Promise<CacheValue | undefined> {
        const provider = this.getCacheProvider();
        if (provider) {
            const hit = await provider.get(region, key);
            if (hit) {
                this.cacheHits ++;
                return hit;
            }
            this.cacheMisses ++;
        }
        return undefined;
    }

    async set(region: string, key: CacheKey, value: CacheValue, ttlSec?: number): Promise<void> {
        const provider = this.getCacheProvider();
        if (provider) {
            this.entriesAdded ++;
            if (!this.regions.includes(region)) {
                this.regions.push(region);
            }
            await provider.set(region, key, value, ttlSec || this.defaultTTLSec);
        }
    }

    async del(region: string, key: CacheKey): Promise<void> {
        const provider = this.getCacheProvider();
        if (provider) {
            await provider.del(region, key);
        }
    }

    async clear(region: string): Promise<void> {
        const provider = this.getCacheProvider();
        if (provider) {
            await provider.clear(region);
        }
    }

    async getEntryCount(region: string): Promise<number | undefined> {
        const provider = this.getCacheProvider();
        if (provider) {
            return provider.getEntryCount(region);
        }
    }

    getStats(): CacheStatistics {
        const { regions, entriesAdded, cacheHits, cacheMisses } = this;
        const regionCount = regions.length;
        const requestsTotal = cacheHits + cacheMisses;
        const cacheHitRatio = requestsTotal > 0 ? cacheHits / requestsTotal : 0;
        return {
            regionCount,
            entriesAdded,
            cacheHitRatio,
        }
    }

    private getCacheProvider(): MashroomMemoryCacheProvider | undefined {
        const provider = context.pluginRegistry.findProvider(this.provider);
        if (!provider) {
            this.logger.error(`Memory cache provider not found: ${this.provider}. Memory cache is inactive!`);
        }
        return provider;
    }

}
