// @flow

import fs from 'fs';
import {promisify} from 'util';
import {lock as lockFile} from 'proper-lockfile';
import shortId from 'shortid';
import lodashFilter from 'lodash.filter';
import ConcurrentAccessError from '../errors/ConcurrentAccessError';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const LOCK_STALE_MS = 3000;
const LOCK_RETRIES = 5;
const LOCK_RETRY_MIN_WAIT = 100;

const CHECK_EXTERNAL_CHANGE_TIMEOUT_MS = 2000;
const PRETTY_PRINT_JSON = true;

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, StorageObjectFilter} from '@mashroom/mashroom-storage/type-definitions';

export default class MashroomStorageCollectionFilestore<T: Object> implements MashroomStorageCollection<T> {

    _loggerFactory: MashroomLoggerFactory;
    _log: MashroomLogger;
    _source: string;
    _dbCache: Object;
    _lastExternalChangeCheck: number;

    constructor(source: string, loggerFactory: MashroomLoggerFactory) {
        this._loggerFactory = loggerFactory;
        this._source = source;
        this._log = loggerFactory('mashroom.storage.filestore');
    }

    async insertOne(item: T) {
        return this._updateOperation((collection) => {
            const insertedItem = Object.assign({}, item, {
               _id: shortId.generate(),
            });
            collection.push(insertedItem);
            return insertedItem;
        });
    }

    async find(filter?: StorageObjectFilter<T>, limit?: number) {
        return this._readOperation((collection) => {
            let result = filter ? lodashFilter(collection, filter) : collection;
            if (limit && result.length > limit) {
                result = result.slice(0, limit);
            }
            return result;
        });
    }

    async findOne(filter: StorageObjectFilter<T>) {
        return this._readOperation((collection) => {
            const result = lodashFilter(collection, filter);
            if (result.length === 0) {
                return null;
            }
            return result[0];
        });
    }

    async updateOne(filter: StorageObjectFilter<T>, propertiesToUpdate: $Shape<T>) {
        return this._updateOperation(async (collection) => {
            const existingItem = await this.findOne(filter);
            if (!existingItem) {
                return {
                    modifiedCount: 0,
                };
            }

            const index = collection.indexOf(existingItem);
            const updatedItem = Object.assign({}, existingItem, propertiesToUpdate);
            collection[index] = updatedItem;

            return {
                modifiedCount: 1,
            };
        });
    }

    async replaceOne(filter: StorageObjectFilter<T>, newItem: T) {
        return this._updateOperation(async (collection) => {
            const existingItem = await this.findOne(filter);
            if (!existingItem) {
                return {
                    modifiedCount: 0,
                };
            }

            const index = collection.indexOf(existingItem);
            const insertedItem = Object.assign({}, newItem, {
                _id: shortId.generate(),
            });
            collection[index] = insertedItem;

            return {
                modifiedCount: 1,
            };
        });
    }

    async deleteOne(filter: StorageObjectFilter<T>) {
        return this._updateOperation(async (collection) => {
            const existingItem = await this.findOne(filter);
            if (!existingItem) {
                return {
                    modifiedCount: 0,
                };
            }

            const index = collection.indexOf(existingItem);
            collection.splice(index, 1);

            return {
                deletedCount: 1,
            };
        });
    }

    async deleteMany(filter: StorageObjectFilter<T>) {
        return this._updateOperation(async (collection) => {
            const existingItems = await this.find(filter);
            existingItems.forEach((existingItem) => {
                const index = collection.indexOf(existingItem);
                collection.splice(index, 1);
            });

            return {
                deletedCount: existingItems.length,
            };
        });
    }

    async _readOperation(op: Array<Object> => any) {
        const db = await this._getDb();
        const collection = this._getCollection(db);
        return op(collection);
    }

    async _updateOperation(op: Array<Object> => any) {
        let release: ?() => Promise<void> = null;
        try {
            release = await this._lock();
        } catch (e) {
            this._log.error(`Couldn't get lock on db file ${this._source}`, e);
            throw new ConcurrentAccessError(`Couldn't get lock for db file: ${this._source}`);
        }
        try {
            const db = await this._getDb(true);
            const collection = this._getCollection(db);
            const result = await op(collection);
            this._log.debug(`Updating db source: ${this._source}`);
            await writeFile(this._source, this._serialize(db));
            this._dbCache = db;
            this._lastExternalChangeCheck = Date.now();
            return result;
        } finally {
            if (release) {
                await release();
            }
        }
    }

    _getCollection(db: Object): Array<Object> {
        return db.d;
    }

    async _getDb(forceExternalChangeCheck?: boolean = false): Promise<Object> {
        try {
            if (this._dbCache) {
                const mTime = fs.statSync(this._source).mtime;
                const mTimeMs = mTime.getTime();
                let reload = (mTimeMs > this._lastExternalChangeCheck && (forceExternalChangeCheck || this._lastExternalChangeCheck + CHECK_EXTERNAL_CHANGE_TIMEOUT_MS < Date.now()));
                if (!reload) {
                    this._log.debug(`Using data from cache since file didn't change since ${mTime.toISOString()}: ${this._source}`);
                    return this._dbCache;
                }
            }

            this._log.debug(`Reloading db source: ${this._source}`);
            const json = await readFile(this._source);
            const db = this._deserialize(json.toString());
            this._dbCache = db;
            this._lastExternalChangeCheck = Date.now();
            return db;
        } catch (e) {
            if (fs.existsSync(this._source)) {
                this._log.error(`Error loading db file: ${this._source}`, e);
            }
        }

        return {
            d: [],
        };
    }

    _lock() {
        return lockFile(this._source, {
            realpath: false,
            stale: LOCK_STALE_MS,
            retries: {
                retries: LOCK_RETRIES,
                factor: 3,
                minTimeout: LOCK_RETRY_MIN_WAIT,
            }
        });
    }

    _serialize(data: Object): string {
        return PRETTY_PRINT_JSON ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    }

    _deserialize(json: string): Object {
        try {
            return JSON.parse(json);
        } catch (e) {
            if (e instanceof SyntaxError) {
                e.message = `Malformed JSON in file: ${this._source}\n${e.message}`;
            }
            throw e;
        }
    }
}
