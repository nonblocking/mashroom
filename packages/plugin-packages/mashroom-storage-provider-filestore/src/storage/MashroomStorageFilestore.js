// @flow

import fsExtra from 'fs-extra';
import path from 'path';
import MashroomStorageCollectionFilestore from './MashroomStorageCollectionFilestore';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorage} from '@mashroom/mashroom-storage/type-definitions';

const COLLECTION_POSTIFX = '.json';

type CollectionMap = {
    [string]: MashroomStorageCollection<any>
}

/**
 * A simple JSON file based storage for test purposes.
 * It supports fast reads but is not suitable for large amounts of data
 * or a lot of changes because the write operations are slow but cluster safe.
 */
export default class MashroomStorageFilestore implements MashroomStorage {

    _collections: CollectionMap;
    _dataFolder: string;
    _loggerFactory: MashroomLoggerFactory;
    _log: MashroomLogger;

    constructor(dataFolder: string, loggerFactory: MashroomLoggerFactory) {
        this._collections = {};
        this._dataFolder = dataFolder;
        this._loggerFactory = loggerFactory;
        this._log = loggerFactory('mashroom.storage.filestore');
        this._log.info(`Filestorage provider data folder: ${this._dataFolder}`);
        this._ensureDbFolderExists();
    }

    async getCollection<T: Object>(name: string) {
        const existingCollection = this._collections[name];
        if (existingCollection) {
            return existingCollection;
        }

        const source = path.resolve(this._dataFolder, name + COLLECTION_POSTIFX);
        const collection = new MashroomStorageCollectionFilestore<any>(source, this._loggerFactory);
        this._collections[name] = collection;
        return collection;
    }

    _ensureDbFolderExists() {
        fsExtra.ensureDirSync(this._dataFolder);
    }

}
