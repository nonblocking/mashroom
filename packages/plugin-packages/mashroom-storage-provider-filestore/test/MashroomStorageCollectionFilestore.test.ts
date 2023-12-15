
import path from 'path';
import fs, {readFileSync, writeFileSync} from 'fs';
import fsExtra from 'fs-extra';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomStorageCollectionFilestore from '../src/storage/MashroomStorageCollectionFilestore';

import type {MashroomStorageCollection} from '@mashroom/mashroom-storage/type-definitions';

const getDbFile = () => {
    const dataFolder = path.resolve(__dirname, './test-data');
    fsExtra.ensureDirSync(dataFolder);
    const dbFile = path.resolve(dataFolder, 'test_db.json');
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    return dbFile;
};

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

describe('MashroomStorageCollectionFilestore', () => {

    it('writes new item and assigns an id', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

        await storage.insertOne({a: 'a'});
        const insertedItem = await storage.insertOne({foo: 'bar'});

        expect(insertedItem).toBeTruthy();
        expect(insertedItem._id).toBeTruthy();
    });

    it('inserts a bunch of new items correctly', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

        for (let i = 0; i < 100; i++) {
            await storage.insertOne({a: i});
        }

        const insertedItems = await storage.find();

        expect(insertedItems.result.length).toBe(100);
    });

    it('returns first match with findOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

        await storage.insertOne({a: 'a'});
        await storage.insertOne({b: 'b'});
        await storage.insertOne({c: 'c'});

        const result1 = await storage.findOne({b: 'b'});
        const result2 = await storage.findOne({b: 'a'});

        expect(result1).toBeTruthy();
        if (result1) {
            expect(result1.b).toBe('b');
        }
        expect(result2).toBeNull();
    });


    it('supports simple filtering', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

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
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

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
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

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
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

        await storage.insertOne({foo: 'this is a test'});
        await storage.insertOne({foo: 'this is something else'});

        const result = await storage.find({ foo: { $not: { $regex: /test/ }}});

        expect(result.result.length).toBe(1);
        expect(result.result[0].foo).toBe('this is something else');
    });

    it('updates an existing item with updateOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

        const insertedItem = await storage.insertOne({a: 1});
        const result = await storage.updateOne({a: 1}, {a: 2, x: {}});
        const updatedItem = await storage.findOne({a: 2});

        expect(updatedItem).toBeTruthy();
        expect(result.modifiedCount).toBe(1);
        expect(insertedItem.a).toBe(1);
        if (updatedItem) {
            expect(updatedItem._id).toBe(insertedItem._id);
            expect(updatedItem.a).toBe(2);
        }
    });

    it('updates multiple existing items with updateMany', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

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
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

        const insertedItem = await storage.insertOne({a: 1, b: 2});
        const result = await storage.replaceOne({a: 1}, {a: 2, x: {}});
        const updatedItem = await storage.findOne({a: 2});

        expect(updatedItem).toBeTruthy();
        expect(result.modifiedCount).toBe(1);
        expect(insertedItem.a).toBe(1);
        if (updatedItem) {
            expect(updatedItem._id).not.toBe(insertedItem._id);
            expect(updatedItem.a).toBe(2);
            expect(updatedItem.b).toBeFalsy();
        }
    });

    it('deletes the existing item with deleteOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

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
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), -1, true, dummyLoggerFactory);

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

    it('checks the db file for updates before every change', async () => {
        const dbFile = getDbFile();
        const checkExternalChangePeriodMs = 2000;
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(dbFile, checkExternalChangePeriodMs, true, dummyLoggerFactory);

        await storage.insertOne({a: 1, b: 1, c: 1});

        // Manipulate store externally
        const db = JSON.parse(readFileSync(dbFile).toString('utf-8'));
        db.d[0].a = 2;
        writeFileSync(dbFile, JSON.stringify(db, null, 2));

        await storage.updateOne({b: 1}, {c: 5});

        const item = await storage.findOne({b: 1});
        expect(item?.c).toBe(5);
        expect(item?.a).toBe(2);
    });

    it('waits checkExternalChangePeriodMs until it reloads a changed db file', async () => {
        const dbFile = getDbFile();
        const checkExternalChangePeriodMs = 2000;
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(dbFile, checkExternalChangePeriodMs, true, dummyLoggerFactory);

        await storage.insertOne({a: 1, b: 1});

        // Manipulate store externally
        const db = JSON.parse(readFileSync(dbFile).toString('utf-8'));
        db.d[0].a = 2;
        writeFileSync(dbFile, JSON.stringify(db, null, 2));

        const attempt1 = await storage.findOne({b: 1});
        expect(attempt1?.a).toBe(1); // Old value

        await new Promise((resolve) => setTimeout(resolve, checkExternalChangePeriodMs + 200));

        const attempt2 = await storage.findOne({b: 1});
        expect(attempt2?.a).toBe(2); // New value
    });
});


