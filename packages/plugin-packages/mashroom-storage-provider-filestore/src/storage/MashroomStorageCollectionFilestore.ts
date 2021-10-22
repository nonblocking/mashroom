
import fs from 'fs';
import {promisify} from 'util';
import {lock as lockFile} from 'proper-lockfile';
import {nanoid} from 'nanoid';
import lodashFilter from 'lodash.filter';
import ConcurrentAccessError from '../errors/ConcurrentAccessError';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomStorageCollection,
    MashroomStorageDeleteResult,
    MashroomStorageObject,
    MashroomStorageObjectFilter,
    MashroomStorageRecord,
    MashroomStorageUpdateResult,
    MashroomStorageSort,
} from '@mashroom/mashroom-storage/type-definitions';
import {JsonDB} from '../../type-definitions';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const LOCK_STALE_MS = 3000;
const LOCK_RETRIES = 5;
const LOCK_RETRY_MIN_WAIT = 100;

export default class MashroomStorageCollectionFilestore<T extends MashroomStorageRecord> implements MashroomStorageCollection<T> {

    private _lastExternalChangeCheck: number;
    private _dbCache: JsonDB<T> | null;
    private _logger: MashroomLogger;

    constructor(private _source: string, private _checkExternalChangePeriodMs: number,
                private _prettyPrintJson: boolean, private _loggerFactory: MashroomLoggerFactory) {
        this._lastExternalChangeCheck = -1;
        this._dbCache = null;
        this._logger = _loggerFactory('mashroom.storage.filestore');
    }

    async insertOne(item: T): Promise<MashroomStorageObject<T>> {
        return this._updateOperation((collection) => {
            const insertedItem = {...item, _id:  this._generateId()};
            collection.push(insertedItem);
            return insertedItem;
        });
    }

    async find(filter?: MashroomStorageObjectFilter<T>, limit?: number, skip?: number, sort?: MashroomStorageSort<T>,): Promise<Array<MashroomStorageObject<T>>> {
        return this._readOperation((collection) => {
            let result = filter ? lodashFilter<MashroomStorageObject<T>>(collection, filter) : collection;
            if (limit && result.length > limit) {
                result = result.slice(0, limit);
            }
            return result;
        });
    }

    async findOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageObject<T> | null | undefined> {
        return this._readOperation((collection) => {
            const result: Array<MashroomStorageObject<T>> = lodashFilter<MashroomStorageObject<T>>(collection, filter);
            if (result.length === 0) {
                return null;
            }
            return result[0];
        });
    }

    async updateOne(filter: MashroomStorageObjectFilter<T>, propertiesToUpdate: Partial<MashroomStorageObject<T>>): Promise<MashroomStorageUpdateResult> {
        return this._updateOperation(async (collection) => {
            const existingItem = await this.findOne(filter);
            if (!existingItem) {
                return {
                    modifiedCount: 0,
                };
            }

            const index = collection.indexOf(existingItem);
            collection[index] = {...existingItem, ...propertiesToUpdate};

            return {
                modifiedCount: 1,
            };
        });
    }

    async replaceOne(filter: MashroomStorageObjectFilter<T>, newItem: T): Promise<MashroomStorageUpdateResult> {
        return this._updateOperation(async (collection) => {
            const existingItem = await this.findOne(filter);
            if (!existingItem) {
                return {
                    modifiedCount: 0,
                };
            }

            const index = collection.indexOf(existingItem);
            collection[index] = {...newItem, _id: this._generateId()};

            return {
                modifiedCount: 1,
            };
        });
    }

    async deleteOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult> {
        return this._updateOperation(async (collection) => {
            const existingItem = await this.findOne(filter);
            if (!existingItem) {
                return {
                    deletedCount: 0,
                };
            }

            const index = collection.indexOf(existingItem);
            collection.splice(index, 1);

            return {
                deletedCount: 1,
            };
        });
    }

    async deleteMany(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult> {
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

    private async _readOperation<S>(op: (data: Array<MashroomStorageObject<T>>) => S): Promise<S> {
        const db = await this._getDb();
        const collection = this._getCollection(db);
        return op(collection);
    }

    private async _updateOperation<S>(op: (data: Array<MashroomStorageObject<T>>) => S): Promise<S> {
        let release: (() => Promise<void>) | null = null;
        try {
            release = await this._lock();
        } catch (e) {
            this._logger.error(`Couldn't get lock on db file ${this._source}`, e);
            throw new ConcurrentAccessError(`Couldn't get lock for db file: ${this._source}`);
        }
        try {
            const db = await this._getDb(true);
            const collection = this._getCollection(db);
            const result = await op(collection);
            this._logger.debug(`Updating db source: ${this._source}`);
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

    private _getCollection(db: JsonDB<T>): Array<MashroomStorageObject<T>> {
        return db.d;
    }

    private async _getDb(forceExternalChangeCheck = false): Promise<JsonDB<T>> {
        try {
            if (this._dbCache) {
                const mTime = fs.statSync(this._source).mtime;
                const mTimeMs = mTime.getTime();
                const reload = (mTimeMs > this._lastExternalChangeCheck && (forceExternalChangeCheck || this._lastExternalChangeCheck + this._checkExternalChangePeriodMs < Date.now()));
                if (!reload) {
                    // this.logger.debug(`Using data from cache since file didn't change since ${mTime.toISOString()}: ${this.source}`);
                    return this._dbCache;
                }
            }

            this._logger.debug(`Reloading db source: ${this._source}`);
            const json = await readFile(this._source);
            const db = this._deserialize(json.toString());
            this._dbCache = db;
            this._lastExternalChangeCheck = Date.now();
            return db;
        } catch (e) {
            if (fs.existsSync(this._source)) {
                this._logger.error(`Error loading db file: ${this._source}`, e);
            }
        }

        return {
            d: [],
        };
    }

    private _lock(): Promise<() => Promise<void>> {
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

    private _serialize(data: JsonDB<T>): string {
        return this._prettyPrintJson ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    }

    private _deserialize(json: string): JsonDB<T> {
        try {
            return JSON.parse(json);
        } catch (e) {
            if (e instanceof SyntaxError) {
                e.message = `Malformed JSON in file: ${this._source}\n${e.message}`;
            }
            throw e;
        }
    }

    private _generateId(): string {
        return nanoid(8);
    }
}
