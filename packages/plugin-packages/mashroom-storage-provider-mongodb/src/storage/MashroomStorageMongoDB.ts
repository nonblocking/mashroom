
import MashroomStorageCollectionMongoDB from './MashroomStorageCollectionMongoDB';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorage, StorageRecord} from '@mashroom/mashroom-storage/type-definitions';

export type CollectionMap = {
    [name: string]: MashroomStorageCollectionMongoDB<any>;
}

export default class MashroomStorageMongoDB implements MashroomStorage {

    private _collections: CollectionMap;

    constructor(private _loggerFactory: MashroomLoggerFactory) {
        this._collections = {};
    }

    async getCollection<T extends StorageRecord>(name: string): Promise<MashroomStorageCollection<T>> {
        const existingCollection = this._collections[name];
        if (existingCollection) {
            return existingCollection;
        }

        const collection = new MashroomStorageCollectionMongoDB<T>(name, this._loggerFactory);
        this._collections[name] = collection;
        return collection;
    }

}
