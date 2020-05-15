
import mongoDBClient from './mongodb_client';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomStorageCollection,
    StorageDeleteResult,
    StorageObject,
    StorageObjectFilter,
    StorageRecord,
    StorageUpdateResult,
} from '@mashroom/mashroom-storage/type-definitions';
import type {Collection} from 'mongodb';

export default class MashroomStorageCollectionMongoDB<T extends StorageRecord> implements MashroomStorageCollection<T> {

    private logger: MashroomLogger;

    constructor(private collectionName: string, private loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.storage.mongodb');
    }

    async find(filter?: StorageObjectFilter<T>, limit?: number): Promise<Array<StorageObject<T>>> {
        const collection = await this.getCollection();
        let cursor = collection.find(filter);
        if (limit) {
            cursor = cursor.limit(limit);
        }
        return await cursor.toArray();
    }

    async findOne(filter: StorageObjectFilter<T>): Promise<StorageObject<T> | null | undefined> {
        const collection = await this.getCollection();
        return await collection.findOne(filter);
    }

    async insertOne(item: T): Promise<StorageObject<T>> {
        const collection = await this.getCollection();
        const result = await collection.insertOne(item);
        return {
            _id: result.insertedId,
            ...item,
        }
    }

    async updateOne(filter: StorageObjectFilter<T>, propertiesToUpdate: Partial<StorageObject<T>>): Promise<StorageUpdateResult> {
        const collection = await this.getCollection();
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

    async replaceOne(filter: StorageObjectFilter<T>, newItem: T): Promise<StorageUpdateResult> {
        const collection = await this.getCollection();
        const result = await collection.replaceOne(filter, newItem);
        return {
            modifiedCount: result.modifiedCount,
        };
    }

    async deleteOne(filter: StorageObjectFilter<T>): Promise<StorageDeleteResult> {
        const collection = await this.getCollection();
        const result = await collection.deleteOne(filter);
        return {
            deletedCount: result.deletedCount || 0,
        };
    }

    async deleteMany(filter: StorageObjectFilter<T>): Promise<StorageDeleteResult> {
        const collection = await this.getCollection();
        const result = await collection.deleteMany(filter);
        return {
            deletedCount: result.deletedCount || 0,
        };
    }

    private async getCollection(): Promise<Collection> {
        const client = await mongoDBClient();
        return client.collection(this.collectionName);
    }
}
