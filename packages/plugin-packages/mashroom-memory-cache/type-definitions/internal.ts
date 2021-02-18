
import type {
    MashroomMemoryCacheProvider, MashroomMemoryCacheService,
} from './api';

export interface MashroomMemoryCacheProviderRegistry {
    readonly providers: Array<MashroomMemoryCacheProvider>;
    findProvider(pluginName: string): MashroomMemoryCacheProvider | undefined;
    register(pluginName: string, provider: MashroomMemoryCacheProvider): void;
    unregister(pluginName: string): void;
}

export interface MashroomMemoryCacheServiceWithStats extends MashroomMemoryCacheService {
    getStats(): CacheStatistics;
}

export type CacheStatistics = {
    regionCount: number;
    entriesAdded: number;
    cacheHitRatio: number;
}

