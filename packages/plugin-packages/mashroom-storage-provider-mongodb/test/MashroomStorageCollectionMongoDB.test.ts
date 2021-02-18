
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {setConnectionUriAndOptions, close} from '../src/mongodb_client';
import MashroomStorageCollectionMongoDB from '../src/storage/MashroomStorageCollectionMongoDB';

import type {MashroomStorageCollection} from '@mashroom/mashroom-storage/type-definitions';

type Test = {
    foo?: string;
    a?: any;
    b?: any;
    c?: any;
    d?: any;
    x?: any;
}

describe('MashroomStorageCollectionMongoDB', () => {

    beforeAll(async () => {
        await setConnectionUriAndOptions(process.env.MONGO_URL || '', {});
    });

    afterAll(async () => {
        await close();
    });

    it('writes new item and assigns an id', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test1', dummyLoggerFactory);

        await storage.insertOne({a: 'a'});
        const insertedItem = await storage.insertOne({foo: 'bar'});

        expect(insertedItem).not.toBeNull();
        expect(insertedItem._id).toBeTruthy();
    });

    it('returns first match with findOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test2', dummyLoggerFactory);

        await storage.insertOne({a: 'a'});
        await storage.insertOne({b: 'b'});
        await storage.insertOne({c: 'c'});

        const result1 = await storage.findOne({b: 'b'});
        const result2 = await storage.findOne({b: 'a'});

        expect(result1).not.toBeNull();
        if (result1) {
            expect(result1.b).toBe('b');
        }
        expect(result2).toBeNull();
    });

    it('returns items filtered with find', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test3', dummyLoggerFactory);

        await storage.insertOne({a: 1});
        await storage.insertOne({b: 1});
        await storage.insertOne({b: 1});
        await storage.insertOne({b: 2});
        await storage.insertOne({b: 1});
        await storage.insertOne({c: 1});

        const result1 = await storage.find({b: 1});
        const result2 = await storage.find({b: 1}, 1);

        expect(result1).not.toBeNull();
        expect(result2).not.toBeNull();
        expect(result1.length).toBe(3);
        expect(result2.length).toBe(1);
    });

    it('updates all properties of an existing property with updateOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test4', dummyLoggerFactory);

        const insertedItem = await storage.insertOne({a: 1});
        const result = await storage.updateOne({a: 1}, {a: 2, x: 'x'});
        const updatedItem = await storage.findOne({a: 2});

        expect(updatedItem).not.toBeNull();
        expect(result.modifiedCount).toBe(1);
        expect(insertedItem.a).toBe(1);
        if (updatedItem) {
            expect(updatedItem._id).toEqual(insertedItem._id);
            expect(updatedItem.a).toBe(2);
        }
    });

    it('replaces the existing item with replaceOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test5', dummyLoggerFactory);

        const insertedItem = await storage.insertOne({a: 1, b: 2});
        const result = await storage.replaceOne({a: 1}, {a: 2, x: 'x'});
        const updatedItem = await storage.findOne({a: 2});

        expect(updatedItem).not.toBeNull();
        expect(result.modifiedCount).toBe(1);
        expect(insertedItem.a).toBe(1);
        if (updatedItem) {
            expect(updatedItem._id).not.toBe(insertedItem._id);
            expect(updatedItem.a).toBe(2);
            expect(updatedItem.b).toBeFalsy();
        }
    });

    it('deletes the existing item with deleteOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test6', dummyLoggerFactory);

        await storage.insertOne({a: 1, b: 1});
        await storage.insertOne({c: 1, d: 1});

        const result1 = await storage.find({b: 1});
        const deleteResult = await storage.deleteOne({b: 1});
        const result2 = await storage.find({b: 1});

        expect(deleteResult.deletedCount).toBe(1);
        expect(result1.length).toBe(1);
        expect(result2.length).toBe(0);
    });

    it('deletes all existing items with deleteMany', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test7', dummyLoggerFactory);

        await storage.insertOne({a: 1, b: 1});
        await storage.insertOne({c: 1, d: 1});
        await storage.insertOne({a: 1, d: 2});
        await storage.insertOne({a: 1, d: 3});

        const result1 = await storage.find({a: 1});
        const deleteResult = await storage.deleteMany({a: 1});
        const result2 = await storage.find({a: 1});

        expect(deleteResult.deletedCount).toBe(3);
        expect(result1.length).toBe(3);
        expect(result2.length).toBe(0);
    });

});


