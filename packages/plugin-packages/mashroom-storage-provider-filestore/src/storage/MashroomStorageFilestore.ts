
import fsExtra from 'fs-extra';
import path from 'path';
import MashroomStorageCollectionFilestore from './MashroomStorageCollectionFilestore';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorage} from '@mashroom/mashroom-storage/type-definitions';
import type {CollectionMap} from '../../type-definitions';

const COLLECTION_POSTIFX = '.json';

/**
 * A simple JSON file based storage for test purposes.
 * It supports fast reads but is not suitable for large amounts of data
 * or a lot of changes because the write operations are slow but cluster safe.
 */
export default class MashroomStorageFilestore implements MashroomStorage {

    private collections: CollectionMap;
    private logger: MashroomLogger;

    constructor(private dataFolder: string, private checkExternalChangePeriodMs: number,
                private prettyPrintJson: boolean, private loggerFactory: MashroomLoggerFactory) {
        this.collections = {};
        this.logger = loggerFactory('mashroom.storage.filestore');
        this.logger.info(`Filestorage provider data folder: ${this.dataFolder}`);
        this.ensureDbFolderExists();
    }

    async getCollection<T extends {}>(name: string): Promise<MashroomStorageCollection<T>> {
        const existingCollection = this.collections[name];
        if (existingCollection) {
            return existingCollection;
        }

        const source = path.resolve(this.dataFolder, name + COLLECTION_POSTIFX);
        const collection = new MashroomStorageCollectionFilestore<T>(source, this.checkExternalChangePeriodMs, this.prettyPrintJson, this.loggerFactory);
        this.collections[name] = collection;
        return collection;
    }

    private ensureDbFolderExists(): void {
        fsExtra.ensureDirSync(this.dataFolder);
    }

}
