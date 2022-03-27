
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {setConnectionUriAndOptions, close} from '../src/mongodb';
import MashroomStorageCollectionMongoDB from '../src/storage/MashroomStorageCollectionMongoDB';

import type {MashroomStorageCollection} from '@mashroom/mashroom-storage/type-definitions';

type Test = {
    foo?: string;
    a?: any;
    b?: any;
    c?: any;
    d?: any;
    x?: {
        m1?: string,
        m2?: number,
    }
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

    it('supports simple filtering', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test3', dummyLoggerFactory);

        await storage.insertOne({a: 1});
        await storage.insertOne({b: 1});
        await storage.insertOne({b: 1});
        await storage.insertOne({b: 2});
        await storage.insertOne({b: 1});
        await storage.insertOne({c: 1});

        const result1 = await storage.find({b: 1});
        const result2 = await storage.find({b: 1}, 1);

        expect(result1).toBeTruthy();
        expect(result2).toBeTruthy();
        expect(result1.result.length).toBe(3);
        expect(result2.result.length).toBe(1);
    });

    it('supports filter operators', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test4', dummyLoggerFactory);

        await storage.insertOne({a: 1, x: {}});
        await storage.insertOne({b: 1, x: {}});
        await storage.insertOne({b: 1, x: {}});
        await storage.insertOne({b: 2});
        await storage.insertOne({b: 1});
        await storage.insertOne({c: 1, x: { m1: 'test' }});

        const result1 = await storage.find({ $and: [{ b: { $gt: 1 }}, { x: { $exists: false }}]});
        const result2 = await storage.find(undefined, undefined, 3, { b: 'asc' });
        const result3 = await storage.find(undefined, 3, undefined, { b: 'desc' });
        const result4 = await storage.find({ 'x.m1': 'test' });

        expect(result1).toBeTruthy();
        expect(result2).toBeTruthy();
        expect(result3).toBeTruthy();
        expect(result4).toBeTruthy();
        expect(result1.result.length).toBe(1);
        expect(result1.totalCount).toBe(1);
        expect(result1.result[0].b).toBe(2);
        expect(result2.result.length).toBe(3);
        expect(result2.totalCount).toBe(6);
        expect(result2.result[2].b).toBe(2);
        expect(result3.result.length).toBe(3);
        expect(result3.totalCount).toBe(6);
        expect(result3.result[0].b).toBe(2);
        expect(result4.result.length).toBe(1);
        expect(result4.totalCount).toBe(1);
    });

    it('supports regex search', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test5', dummyLoggerFactory);

        await storage.insertOne({foo: 'this is a test'});
        await storage.insertOne({foo: 'this is something else'});
        await storage.insertOne({foo: 'this is a test2!'});
        await storage.insertOne({foo: 'test this is'});

        const result1 = await storage.find({ foo: { $regex: /test/ }});
        const result2 = await storage.find({ foo: { $regex: 'test' }});
        const result3 = await storage.find({ foo: { $regex: /^te.{2}/ }});

        expect(result1.result.length).toBe(3);
        expect(result2.result.length).toBe(3);
        expect(result3.result.length).toBe(1);
    });

    it('supports the not operator', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test6', dummyLoggerFactory);

        await storage.insertOne({foo: 'this is a test'});
        await storage.insertOne({foo: 'this is something else'});

        const result = await storage.find({ foo: { $not: { $regex: /test/ }}});

        expect(result.result.length).toBe(1);
        expect(result.result[0].foo).toBe('this is something else');
    });

    it('updates all properties of an existing property with updateOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test7', dummyLoggerFactory);

        const insertedItem = await storage.insertOne({a: 1});
        const result = await storage.updateOne({a: 1}, {a: 2, x: {}});
        const updatedItem = await storage.findOne({a: 2});

        expect(updatedItem).not.toBeNull();
        expect(result.modifiedCount).toBe(1);
        expect(insertedItem.a).toBe(1);
        if (updatedItem) {
            expect(updatedItem._id).toEqual(insertedItem._id);
            expect(updatedItem.a).toBe(2);
        }
    });

    it('updates all properties of an existing property with updateMany', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test8', dummyLoggerFactory);

        await storage.insertOne({a: 1, b: 1});
        await storage.insertOne({a: 1, b: 2});
        await storage.insertOne({a: 1, b: 3});
        await storage.insertOne({a: 3, b: 3});
        const result = await storage.updateMany({a: 1}, {a: 2, x: {}});
        const updatedItems = await storage.find({a: 2});

        expect(updatedItems.result.length).toBe(3);
        expect(result.modifiedCount).toBe(3);
    });

    it('replaces the existing item with replaceOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test9', dummyLoggerFactory);

        const insertedItem = await storage.insertOne({a: 1, b: 2});
        const result = await storage.replaceOne({a: 1}, {a: 2, x: {}});
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
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test10', dummyLoggerFactory);

        await storage.insertOne({a: 1, b: 1});
        await storage.insertOne({c: 1, d: 1});

        const result1 = await storage.find({b: 1});
        const deleteResult = await storage.deleteOne({b: 1});
        const result2 = await storage.find({b: 1});

        expect(deleteResult.deletedCount).toBe(1);
        expect(result1.result.length).toBe(1);
        expect(result2.result.length).toBe(0);
    });

    it('deletes all existing items with deleteMany', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionMongoDB('test11', dummyLoggerFactory);

        await storage.insertOne({a: 1, b: 1});
        await storage.insertOne({c: 1, d: 1});
        await storage.insertOne({a: 1, d: 2});
        await storage.insertOne({a: 1, d: 3});

        const result1 = await storage.find({a: 1});
        const deleteResult = await storage.deleteMany({a: 1});
        const result2 = await storage.find({a: 1});

        expect(deleteResult.deletedCount).toBe(3);
        expect(result1.result.length).toBe(3);
        expect(result2.result.length).toBe(0);
    });


});


