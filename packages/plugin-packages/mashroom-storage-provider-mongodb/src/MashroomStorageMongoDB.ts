
import MashroomStorageCollectionMongoDB from './MashroomStorageCollectionMongoDB';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorage} from '@mashroom/mashroom-storage/type-definitions';

export default class MashroomStorageMongoDB implements MashroomStorage {

    constructor(private loggerFactory: MashroomLoggerFactory) {
    }

    async getCollection<T extends {}>(name: string): Promise<MashroomStorageCollection<T>> {
        return new MashroomStorageCollectionMongoDB(name, this.loggerFactory);
    }

}
