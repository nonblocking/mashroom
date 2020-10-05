
# Mashroom Storage

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a storage service.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-storage** as *dependency*.

Then use the security service like this:

```js
// @flow

import type {MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';

export default async (req: ExpressRequest, res: ExpressResponse) => {
    const storageService: MashroomStorageService = req.pluginContext.services.storage.service;

    const pagesCollection = await storageService.getCollection('mashroom-portal-pages');

    const page = await pagesCollection.findOne({pageId});

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
     * _enabled_: Enable cache (of all) collections. The preferred way is to set this to false and enable caching per collection  (default: false)
     * _ttlSec_: The default TTL in seconds. Can be overwritten per collection (default: 120)
     + _invalidateOnUpdate_: Clear the cache for the whole collection if an entry gets updated (default: true).
       This might be an expensive operation on some memory cache implementations (e.g. based on Redis). So use this only
       if updates don't happen frequently.
     * _collections_: A map of collections specific settings. You can overwrite here _enabled_, _ttlSec_ and _invalidateOnUpdate_.

## Services

### MashroomStorageService

The exposed service is accessible through _pluginContext.services.storage.service_

**Interface:**

```js
export interface MashroomStorageService {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T: {}>(name: string): Promise<MashroomStorageCollection<T>>;
}

export interface MashroomStorageCollection<T: Object> {
    /**
     * Find all items that match given filter (e.g. { name: 'foo' }).
     */
    find(filter?: StorageObjectFilter<T>, limit?: number): Promise<Array<StorageObject<T>>>;
    /**
     * Return the first item that matches the given filter or null otherwise.
     */
    findOne(filter: StorageObjectFilter<T>): Promise<?StorageObject<T>>;
    /**
     * Insert one item
     */
    insertOne(item: T): Promise<StorageObject<T>>;
    /**
     * Update the first item that matches the given filter.
     */
    updateOne(filter: StorageObjectFilter<T>, propertiesToUpdate: $Shape<StorageObject<T>>): Promise<StorageUpdateResult>;
    /**
     * Replace the first item that matches the given filter.
     */
    replaceOne(filter: StorageObjectFilter<T>, newItem: T): Promise<StorageUpdateResult>;
    /**
     * Delete the first item that matches the given filter.
     */
    deleteOne(filter: StorageObjectFilter<T>): Promise<StorageUpdateResult>;
    /**
     * Delete all items that matches the given filter.
     */
    deleteMany(filter: StorageObjectFilter<T>): Promise<StorageUpdateResult>;
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

```js
// @flow

import MyStorage from './MyStorage';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    return new MyStorage(/* .... */);
};

export default bootstrap;
```

The plugin has to implement the following interfaces:

```js
export interface MashroomStorage {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T: {}>(name: string): Promise<MashroomStorageCollection<T>>;
}

export interface MashroomStorageCollection<T: {}> {
    /**
     * Find all items that match given filter (e.g. { name: 'foo' }).
     */
    find(filter?: StorageObjectFilter<T>, limit?: number): Promise<Array<StorageObject<T>>>;
    /**
     * Return the first item that matches the given filter or null otherwise.
     */
    findOne(filter: StorageObjectFilter<T>): Promise<?StorageObject<T>>;
    /**
     * Insert one item
     */
    insertOne(item: T): Promise<StorageObject<T>>;
    /**
     * Update the first item that matches the given filter.
     */
    updateOne(filter: StorageObjectFilter<T>, propertiesToUpdate: $Shape<StorageObject<T>>): Promise<StorageUpdateResult>;
    /**
     * Replace the first item that matches the given filter.
     */
    replaceOne(filter: StorageObjectFilter<T>, newItem: T): Promise<StorageUpdateResult>;
    /**
     * Delete the first item that matches the given filter.
     */
    deleteOne(filter: StorageObjectFilter<T>): Promise<StorageDeleteResult>;
    /**
     * Delete all items that matches the given filter.
     */
    deleteMany(filter: StorageObjectFilter<T>): Promise<StorageDeleteResult>;
}
```
