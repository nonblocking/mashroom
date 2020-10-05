
import { ensureDirSync } from 'fs-extra';
import { isAbsolute, resolve } from 'path';
import MashroomStorageCollectionFilestore from './MashroomStorageCollectionFilestore';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorage} from '@mashroom/mashroom-storage/type-definitions';
import type {CollectionMap} from '../../type-definitions';

const COLLECTION_POSTIFX = '.json';

/**
 * A simple JSON file based storage for test purposes.
 * It supports fast reads but is not suitable for large amounts of data
 * or a lot of changes because the write operations are slow but cluster safe.
 */
export default class MashroomStorageFilestore implements MashroomStorage {

    private readonly collections: CollectionMap;
    private dataFolder: string;

    constructor(dataFolder: string, serverRootFolder: string, private checkExternalChangePeriodMs: number,
                private prettyPrintJson: boolean, private loggerFactory: MashroomLoggerFactory) {
        this.collections = {};
        const logger = loggerFactory('mashroom.storage.filestore');

        if (!isAbsolute(dataFolder)) {
            this.dataFolder = resolve(serverRootFolder, dataFolder);
        } else {
            this.dataFolder = dataFolder;
        }

        logger.info(`File storage provider data folder: ${this.dataFolder}`);
        ensureDirSync(this.dataFolder);
    }

    async getCollection<T extends {}>(name: string): Promise<MashroomStorageCollection<T>> {
        const existingCollection = this.collections[name];
        if (existingCollection) {
            return existingCollection;
        }

        const source = resolve(this.dataFolder, name + COLLECTION_POSTIFX);
        const collection = new MashroomStorageCollectionFilestore<T>(source, this.checkExternalChangePeriodMs, this.prettyPrintJson, this.loggerFactory);
        this.collections[name] = collection;
        return collection;
    }

}
