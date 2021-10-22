
import { ensureDirSync } from 'fs-extra';
import { isAbsolute, resolve } from 'path';
import MashroomStorageCollectionFilestore from './MashroomStorageCollectionFilestore';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorage, MashroomStorageRecord} from '@mashroom/mashroom-storage/type-definitions';
import type {CollectionMap} from '../../type-definitions';

const COLLECTION_POSTIFX = '.json';

/**
 * A simple JSON file based storage for test purposes.
 * It supports fast reads but is not suitable for large amounts of data
 * or a lot of changes because the write operations are slow but cluster safe.
 */
export default class MashroomStorageFilestore implements MashroomStorage {

    private _collections: CollectionMap;
    private _dataFolder: string;

    constructor(dataFolder: string, serverRootFolder: string, private _checkExternalChangePeriodMs: number,
                private _prettyPrintJson: boolean, private _loggerFactory: MashroomLoggerFactory) {
        this._collections = {};
        const logger = _loggerFactory('mashroom.storage.filestore');

        if (!isAbsolute(dataFolder)) {
            this._dataFolder = resolve(serverRootFolder, dataFolder);
        } else {
            this._dataFolder = dataFolder;
        }

        logger.info(`File storage provider data folder: ${this._dataFolder}`);
        ensureDirSync(this._dataFolder);
    }

    async getCollection<T extends MashroomStorageRecord>(name: string): Promise<MashroomStorageCollection<T>> {
        const existingCollection = this._collections[name];
        if (existingCollection) {
            return existingCollection;
        }

        const source = resolve(this._dataFolder, name + COLLECTION_POSTIFX);
        const collection = new MashroomStorageCollectionFilestore<T>(source, this._checkExternalChangePeriodMs, this._prettyPrintJson, this._loggerFactory);
        this._collections[name] = collection;
        return collection;
    }

}
