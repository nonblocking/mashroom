
# Mashroom Storage

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a storage service abstraction that delegates to a provider plugin.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-storage** as *dependency*.

Then use the storage service like this:

```ts
import type {MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';

export default async (req: Request, res: ExpressResponse) => {
    const storageService: MashroomStorageService = req.pluginContext.services.storage.service;

    const customerCollection = await storageService.getCollection('my-collection');

    const customer = await customerCollection.findOne({customerNr: 1234567});
    const customers = await customerCollection.find({ $and: [{ name: { $regex: 'jo.*' } }, { visits: { $gt: 10 } }], 20, 10, { visits: 'desc' });

    // ...
}
```

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
       "Mashroom Storage Services": {
           "provider": "Mashroom Storage Filestore Provider",
           "memoryCache": {
               "enabled": false,
               "ttlSec": 120,
               "invalidateOnUpdate": true,
               "collections": {
                   "mashroom-portal-pages": {
                      "enabled": true,
                      "ttlSec": 300
                   }
               }
           }
       }
    }
}
```

 * _provider_: The storage-provider plugin that implements the actual storage (Default: Mashroom Storage Filestore Provider)
 * _memoryCache_: Use the memory cache to improve the performance. Requires *@mashroom/mashroom-memory-cache* to be installed.
     * _enabled_: Enable cache (of all) collections. The preferred way is to set this to false and enable caching per collection (Default: false)
     * _ttlSec_: The default TTL in seconds. Can be overwritten per collection (Default: 120)
     + _invalidateOnUpdate_: Clear the cache for the whole collection if an entry gets updated (Default: true).
       This might be an expensive operation on some memory cache implementations (e.g. based on Redis). So use this only
       if updates don't happen frequently.
     * _collections_: A map of collections specific settings. You can overwrite here _enabled_, _ttlSec_ and _invalidateOnUpdate_.

## Services

### MashroomStorageService

The exposed service is accessible through _pluginContext.services.storage.service_

**Interface:**

```ts
export interface MashroomStorageService {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T extends StorageRecord>(name: string): Promise<MashroomStorageCollection<T>>;
}

export interface MashroomStorageCollection<T extends MashroomStorageRecord> {
    /**
     * Find all items that match given filter. The filter supports a subset of Mongo's filter operations (like $gt, $regex, ...).
     */
    find(filter?: MashroomStorageObjectFilter<T>, limit?: number, skip?: number, sort?: MashroomStorageSort<T>): Promise<Array<MashroomStorageObject<T>>>;

    /**
     * Return the first item that matches the given filter or null otherwise.
     */
    findOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageObject<T> | null | undefined>;

    /**
     * Insert one item
     */
    insertOne(item: T): Promise<MashroomStorageObject<T>>;

    /**
     * Update the first item that matches the given filter.
     */
    updateOne(filter: MashroomStorageObjectFilter<T>, propertiesToUpdate: Partial<MashroomStorageObject<T>>): Promise<MashroomStorageUpdateResult>;

    /**
     * Replace the first item that matches the given filter.
     */
    replaceOne(filter: MashroomStorageObjectFilter<T>, newItem: T): Promise<MashroomStorageUpdateResult>;

    /**
     * Delete the first item that matches the given filter.
     */
    deleteOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult>;

    /**
     * Delete all items that matches the given filter.
     */
    deleteMany(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult>;
}
```

## Plugin type

### storage-provider

This plugin type adds a a new storage implementation that can be used by this plugin.

To register a new storage-provider plugin add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My Storage Provider",
                "type": "storage-provider",
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
import MyStorage from './MyStorage';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    return new MyStorage(/* .... */);
};

export default bootstrap;
```

The plugin has to implement the following interfaces:

```ts
export interface MashroomStorage {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T extends StorageRecord>(
        name: string,
    ): Promise<MashroomStorageCollection<T>>;
}
```
