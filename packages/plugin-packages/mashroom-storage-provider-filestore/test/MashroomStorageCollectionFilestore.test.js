// @flow

import path from 'path';
import fs from 'fs';
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

type Test = {|
    foo?: string,
    a?: any,
    b?: any,
    c?: any,
    d?: any,
    x?: any,
|}

describe('MashroomStorageCollectionFilestore', () => {

    it('writes new item and assigns an id', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), dummyLoggerFactory);

        await storage.insertOne({a: 'a'});
        const insertedItem = await storage.insertOne({foo: 'bar'});

        expect(insertedItem).toBeTruthy();
        expect(insertedItem._id).toBeTruthy();
    });

    it('returns first match with findOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), dummyLoggerFactory);

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

    it('returns items filtered with find', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), dummyLoggerFactory);

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
        expect(result1.length).toBe(3);
        expect(result2.length).toBe(1);
    });

    it('updates all properties of an existing property with updateOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), dummyLoggerFactory);

        const insertedItem = await storage.insertOne({a: 1});
        const result = await storage.updateOne({a: 1}, {a: 2, x: 'x'});
        const updatedItem = await storage.findOne({a: 2});

        expect(updatedItem).toBeTruthy();
        expect(result.modifiedCount).toBe(1);
        expect(insertedItem.a).toBe(1);
        if (updatedItem) {
            expect(updatedItem._id).toBe(insertedItem._id);
            expect(updatedItem.a).toBe(2);
        }
    });

    it('replaces the existing item with replaceOne', async () => {
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), dummyLoggerFactory);

        const insertedItem = await storage.insertOne({a: 1, b: 2});
        const result = await storage.replaceOne({a: 1}, {a: 2, x: 'x'});
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
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), dummyLoggerFactory);

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
        const storage: MashroomStorageCollection<Test> = new MashroomStorageCollectionFilestore(getDbFile(), dummyLoggerFactory);

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


