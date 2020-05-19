// @flow

import type {MashroomPluginConfig, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';

/**
 * Bootstrap method definition for cache-store-provider plugins
 */
export type MashroomMemoryCacheProviderPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomMemoryCacheProvider>;

export interface MashroomMemoryCacheService {
    /**
     * Get a cache entry from given region
     */
    get(region: string, key: string): Promise<?any>;
    /**
     * Set a cache entry in given region
     */
    set(region: string, key: string, value: any, ttlSec?: number): Promise<void>;
    /**
     * Delete an entry in given region
     */
    del(region: string, key: string): Promise<void>;
    /**
     * Clear the entire region
     * This might be an expensive operation, depending on the provider
     */
    clear(region: string): Promise<void>;
    /**
     * Get the number of entries in this region (if possible)
     * This might be an expensive operation, depending on the provider
     */
    getEntryCount(region: string): Promise<?number>;
}

export interface MashroomMemoryCacheProvider {
    /**
     * Get a cache entry from given region
     */
    get(region: string, key: string): Promise<?any>;
    /**
     * Set a cache entry in given region
     */
    set(region: string, key: string, value: any, ttlSec: number): Promise<void>;
    /**
     * Delete an entry in given region
     */
    del(region: string, key: string): Promise<void>;
    /**
     * Clear the entire region
     */
    clear(region: string): Promise<void>;
    /**
     * Get the number of entries in this region (if possible)
     */
    getEntryCount(region: string): Promise<?number>;
}
