
### Mashroom Storage

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

This plugin adds a storage service.

#### Usage

If _node_modules/@mashroom_ is configured as plugin path just add this package as _dependency_.

Then use the security service like this:

```js
// @flow

import type {MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';

const storageService: MashroomStorageService = req.pluginContext.services.storage.service;

const pagesCollection = await storageService.getCollection('mashroom-portal-pages');

const page = await pagesCollection.findOne({pageId});
```

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
       "Mashroom Storage Services": {
           "provider": "Mashroom Storage Filestore Provider"
       }
    }
}
```

 * _provider_: The storage-provider plugin that implements the actual storage (Default: Mashroom Storage Filestore Provider)

#### Services

##### MashroomStorageService

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

#### Plugin type

##### storage-provider

Registers a Storage Provider that can be used by this plugin.

To register a storage-provider plugin add this to _package.json_:

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

Which has to implement the following interface:

```js
export interface MashroomStorage {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T: {}>(name: string): Promise<MashroomStorageCollection<T>>;
}
```