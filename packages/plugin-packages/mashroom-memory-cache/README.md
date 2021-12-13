
# Mashroom Memory Cache

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a general purpose memory cache service. Some other plugins will automatically use
it if present, for example *mashroom-storage*.

The cache service provides multiple _regions_ with the possibility to clear single regions.
It comes with a built-in provider that uses the local Node.js memory, which is not ideal for clusters.
But it can also be configured to use another provider, e.g. an implementation based on *Redis*.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-memory-cache** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Memory Cache Services": {
            "provider": "local",
            "defaultTTLSec": 300
        }
    }
}
```

 * _provider_: The name of the provider. Default is *local* which uses the local Node.js memory.
 * _defaultTTLSec_: The default TTL in seconds (Default: 300)

## Services

### MashroomMemoryCacheService

The exposed service is accessible through _pluginContext.services.cache.service_

**Interface:**

```ts
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
```
## Plugin Types

### memory-cache-provider

This plugin type adds a memory cache provider that can be used by this plugin.

To register a custom memory-cache-provider plugin add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My Cache Store Provider",
                "type": "memory-cache-provider",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "defaultConfig": {
                    "myProperty": "test"
                }
            }
        ]
    }
}
```

The bootstrap returns the provider:

```ts
import type {MashroomMemoryCacheProviderPluginBootstrapFunction} from '@mashroom/mashroom-memory-cache/type-definitions';

const bootstrap: MashroomMemoryCacheProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MyCacheStore();
};

export default bootstrap;
```

And the provider has to implement the following interface:

```ts
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
```
