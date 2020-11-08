
import MashroomStorageCollectionMongoDB from './MashroomStorageCollectionMongoDB';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorage, StorageRecord} from '@mashroom/mashroom-storage/type-definitions';

export type CollectionMap = {
    [name: string]: MashroomStorageCollectionMongoDB<any>;
}

export default class MashroomStorageMongoDB implements MashroomStorage {

    private readonly collections: CollectionMap;

    constructor(private loggerFactory: MashroomLoggerFactory) {
        this.collections = {};
    }

    async getCollection<T extends StorageRecord>(name: string): Promise<MashroomStorageCollection<T>> {
        const existingCollection = this.collections[name];
        if (existingCollection) {
            return existingCollection;
        }

        const collection = new MashroomStorageCollectionMongoDB<T>(name, this.loggerFactory);
        this.collections[name] = collection;
        return collection;
    }

}
