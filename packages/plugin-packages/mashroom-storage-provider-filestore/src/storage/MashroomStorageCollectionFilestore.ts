
import fs from 'fs';
import {promisify} from 'util';
import {lock as lockFile} from 'proper-lockfile';
import shortId from 'shortid';
import lodashFilter from 'lodash.filter';
import ConcurrentAccessError from '../errors/ConcurrentAccessError';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomStorageCollection,
    StorageDeleteResult,
    StorageObject,
    StorageObjectFilter,
    StorageRecord,
    StorageUpdateResult
} from '@mashroom/mashroom-storage/type-definitions';
import {JsonDB} from "../../type-definitions";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const LOCK_STALE_MS = 3000;
const LOCK_RETRIES = 5;
const LOCK_RETRY_MIN_WAIT = 100;

export default class MashroomStorageCollectionFilestore<T extends StorageRecord> implements MashroomStorageCollection<T> {

    private lastExternalChangeCheck: number;
    private dbCache: JsonDB<T> | null;
    private logger: MashroomLogger;

    constructor(private source: string, private checkExternalChangePeriodMs: number,
                private prettyPrintJson: boolean, private loggerFactory: MashroomLoggerFactory) {
        this.lastExternalChangeCheck = -1;
        this.dbCache = null;
        this.logger = loggerFactory('mashroom.storage.filestore');
    }

    async insertOne(item: T): Promise<StorageObject<T>> {
        return this.updateOperation((collection) => {
            const insertedItem = Object.assign({}, item, {
               _id: shortId.generate(),
            });
            collection.push(insertedItem);
            return insertedItem;
        });
    }

    async find(filter?: StorageObjectFilter<T>, limit?: number): Promise<Array<StorageObject<T>>> {
        return this.readOperation((collection) => {
            let result = filter ? lodashFilter<StorageObject<T>>(collection, filter) : collection;
            if (limit && result.length > limit) {
                result = result.slice(0, limit);
            }
            return result;
        });
    }

    async findOne(filter: StorageObjectFilter<T>): Promise<StorageObject<T> | null | undefined> {
        return this.readOperation((collection) => {
            const result: Array<StorageObject<T>> = lodashFilter<StorageObject<T>>(collection, filter);
            if (result.length === 0) {
                return null;
            }
            return result[0];
        });
    }

    async  updateOne(filter: StorageObjectFilter<T>, propertiesToUpdate: Partial<StorageObject<T>>): Promise<StorageUpdateResult> {
        return this.updateOperation(async (collection) => {
            const existingItem = await this.findOne(filter);
            if (!existingItem) {
                return {
                    modifiedCount: 0,
                };
            }

            const index = collection.indexOf(existingItem);
            collection[index] = Object.assign({}, existingItem, propertiesToUpdate);

            return {
                modifiedCount: 1,
            };
        });
    }

    async replaceOne(filter: StorageObjectFilter<T>, newItem: T): Promise<StorageUpdateResult> {
        return this.updateOperation(async (collection) => {
            const existingItem = await this.findOne(filter);
            if (!existingItem) {
                return {
                    modifiedCount: 0,
                };
            }

            const index = collection.indexOf(existingItem);
            collection[index] = Object.assign({}, newItem, {
                _id: shortId.generate(),
            });

            return {
                modifiedCount: 1,
            };
        });
    }

    async deleteOne(filter: StorageObjectFilter<T>): Promise<StorageDeleteResult> {
        return this.updateOperation(async (collection) => {
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

    async deleteMany(filter: StorageObjectFilter<T>): Promise<StorageDeleteResult> {
        return this.updateOperation(async (collection) => {
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

    private async readOperation<S>(op: (data: Array<StorageObject<T>>) => S): Promise<S> {
        const db = await this.getDb();
        const collection = this.getCollection(db);
        return op(collection);
    }

    private async updateOperation<S>(op: (data: Array<StorageObject<T>>) => S): Promise<S> {
        let release: (() => Promise<void>) | null = null;
        try {
            release = await this.lock();
        } catch (e) {
            this.logger.error(`Couldn't get lock on db file ${this.source}`, e);
            throw new ConcurrentAccessError(`Couldn't get lock for db file: ${this.source}`);
        }
        try {
            const db = await this.getDb(true);
            const collection = this.getCollection(db);
            const result = await op(collection);
            this.logger.debug(`Updating db source: ${this.source}`);
            await writeFile(this.source, this.serialize(db));
            this.dbCache = db;
            this.lastExternalChangeCheck = Date.now();
            return result;
        } finally {
            if (release) {
                await release();
            }
        }
    }

    private getCollection(db: JsonDB<T>): Array<StorageObject<T>> {
        return db.d;
    }

    private async getDb(forceExternalChangeCheck = false): Promise<JsonDB<T>> {
        try {
            if (this.dbCache) {
                const mTime = fs.statSync(this.source).mtime;
                const mTimeMs = mTime.getTime();
                const reload = (mTimeMs > this.lastExternalChangeCheck && (forceExternalChangeCheck || this.lastExternalChangeCheck + this.checkExternalChangePeriodMs < Date.now()));
                if (!reload) {
                    this.logger.debug(`Using data from cache since file didn't change since ${mTime.toISOString()}: ${this.source}`);
                    return this.dbCache;
                }
            }

            this.logger.debug(`Reloading db source: ${this.source}`);
            const json = await readFile(this.source);
            const db = this.deserialize(json.toString());
            this.dbCache = db;
            this.lastExternalChangeCheck = Date.now();
            return db;
        } catch (e) {
            if (fs.existsSync(this.source)) {
                this.logger.error(`Error loading db file: ${this.source}`, e);
            }
        }

        return {
            d: [],
        };
    }

    private lock(): Promise<() => Promise<void>> {
        return lockFile(this.source, {
            realpath: false,
            stale: LOCK_STALE_MS,
            retries: {
                retries: LOCK_RETRIES,
                factor: 3,
                minTimeout: LOCK_RETRY_MIN_WAIT,
            }
        });
    }

    private serialize(data: JsonDB<T>): string {
        return this.prettyPrintJson ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    }

    private deserialize(json: string): JsonDB<T> {
        try {
            return JSON.parse(json);
        } catch (e) {
            if (e instanceof SyntaxError) {
                e.message = `Malformed JSON in file: ${this.source}\n${e.message}`;
            }
            throw e;
        }
    }
}
