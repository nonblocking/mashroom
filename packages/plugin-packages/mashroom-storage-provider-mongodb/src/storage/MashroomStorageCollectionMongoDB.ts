
import mongoDB from '../mongodb';

import type {Collection, OptionalId} from 'mongodb';
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

export default class MashroomStorageCollectionMongoDB<T extends MashroomStorageRecord> implements MashroomStorageCollection<T> {

    private _logger: MashroomLogger;

    constructor(private _collectionName: string, private _loggerFactory: MashroomLoggerFactory) {
        this._logger = _loggerFactory('mashroom.storage.mongodb');
    }

    async find(filter?: MashroomStorageObjectFilter<T>, limit?: number, skip?: number, sort?: MashroomStorageSort<T>): Promise<Array<MashroomStorageObject<T>>> {
        const collection = await this._getCollection<MashroomStorageObject<T>>();
        let cursor = collection.find(filter || {});
        if (sort) {
            cursor = cursor.sort(sort);
        }
        if (skip) {
            cursor = cursor.skip(skip);
        }
        if (limit) {
            cursor = cursor.limit(limit);
        }
        return await cursor.toArray();
    }

    async findOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageObject<T> | null | undefined> {
        const collection = await this._getCollection<MashroomStorageObject<T>>();
        return collection.findOne(filter);
    }

    async insertOne(item: T): Promise<MashroomStorageObject<T>> {
        const collection = await this._getCollection<MashroomStorageObject<T>>();
        const result = await collection.insertOne(item as OptionalId<MashroomStorageObject<T>>);
        return {
            _id: result.insertedId,
            ...item,
        }
    }

    async updateOne(filter: MashroomStorageObjectFilter<T>, propertiesToUpdate: Partial<MashroomStorageObject<T>>): Promise<MashroomStorageUpdateResult> {
        const collection = await this._getCollection<MashroomStorageObject<T>>();
        const cleanProperties = {
            ...propertiesToUpdate,
        };
        delete cleanProperties._id;
        const result = await collection.updateOne(filter, {
            $set: cleanProperties,
        });
        return {
            modifiedCount: result.modifiedCount,
        };
    }

    async replaceOne(filter: MashroomStorageObjectFilter<T>, newItem: T): Promise<MashroomStorageUpdateResult> {
        const collection = await this._getCollection<MashroomStorageObject<T>>();
        const result = await collection.replaceOne(filter, newItem as MashroomStorageObject<T>);
        return {
            modifiedCount: result.modifiedCount,
        };
    }

    async deleteOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult> {
        const collection = await this._getCollection<MashroomStorageObject<T>>();
        const result = await collection.deleteOne(filter);
        return {
            deletedCount: result.deletedCount || 0,
        };
    }

    async deleteMany(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult> {
        const collection = await this._getCollection<MashroomStorageObject<T>>();
        const result = await collection.deleteMany(filter);
        return {
            deletedCount: result.deletedCount || 0,
        };
    }

    private async _getCollection<T>(): Promise<Collection<T>> {
        const db = await mongoDB(this._logger);
        return db.collection(this._collectionName);
    }
}
