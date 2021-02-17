
import type {MashroomPluginConfig, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';

export type CacheKey = string;
export type CacheValue = string | number | Record<string, any>;

/**
 * Bootstrap method definition for cache-store-provider plugins
 */
export type MashroomMemoryCacheProviderPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomMemoryCacheProvider>;

export interface MashroomMemoryCacheService {
    /**
     * Get a cache entry from given region
     */
    get(region: string, key: CacheKey): Promise<CacheValue | undefined>;
    /**
     * Set a cache entry in given region
     */
    set(region: string, key: CacheKey, value: CacheValue, ttlSec?: number): Promise<void>;
    /**
     * Delete an entry in given region
     */
    del(region: string, key: CacheKey): Promise<void>;
    /**
     * Clear the entire region
     * This might be an expensive operation, depending on the provider
     */
    clear(region: string): Promise<void>;
    /**
     * Get the number of entries in this region (if possible)
     * This might be an expensive operation, depending on the provider
     */
    getEntryCount(region: string): Promise<number | undefined>;
}

export interface MashroomMemoryCacheProvider {
    /**
     * Get a cache entry from given region
     */
    get(region: string, key: CacheKey): Promise<CacheValue | undefined>;
    /**
     * Set a cache entry in given region
     */
    set(region: string, key: CacheKey, value: CacheValue, ttlSec: number): Promise<void>;
    /**
     * Delete an entry in given region
     */
    del(region: string, key: CacheKey): Promise<void>;
    /**
     * Clear the entire region
     */
    clear(region: string): Promise<void>;
    /**
     * Get the number of entries in this region (if possible)
     */
    getEntryCount(region: string): Promise<number | undefined>;
}
