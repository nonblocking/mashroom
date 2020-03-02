
import MashroomStorageCollectionMongoDB from './MashroomStorageCollectionMongoDB';

import {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import {MashroomStorageCollection, MashroomStorage} from '@mashroom/mashroom-storage/type-definitions';

export default class MashroomStorageFilestore implements MashroomStorage {

    constructor(private loggerFactory: MashroomLoggerFactory) {
    }

    async getCollection<T extends {}>(name: string): Promise<MashroomStorageCollection<T>> {
        return new MashroomStorageCollectionMongoDB(name, this.loggerFactory);
    }

}
