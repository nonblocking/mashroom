// @flow
import fs from 'fs';
import os from 'os';
import path from 'path';
import { dummyLoggerFactory } from '@mashroom/mashroom-utils/lib/logging_utils';
import ReconnectMessageBufferStore from '../src/backend/webapp/ReconnectMessageBufferStore';

const BASE_PATH = os.tmpdir();
const NAME = 'user_42';

describe('Tmp File Storage', () => {
    const storage = new ReconnectMessageBufferStore(BASE_PATH, dummyLoggerFactory);

    afterAll(async () => {
        return storage.removeFile(NAME);
    });

    it('should be enabled when some directory provided', () => {
       expect(storage.enabled).toBeTruthy();
    });

    it('should not be enabled when invalid path provided', () => {
       const storeWithInvalidPath = new ReconnectMessageBufferStore('/IDoNoExist', dummyLoggerFactory);

       expect(storeWithInvalidPath.enabled).toBeFalsy();
    });

    it('should be disabled when no directory provided', async () => {
        const storeWithoutDir = new ReconnectMessageBufferStore(null, dummyLoggerFactory);
        expect(storeWithoutDir.enabled).toBeFalsy();
        expect(await storeWithoutDir.getData('xyz')).toEqual([]);
    });

    it('should append data into tmp file', async () => {
        await storage.appendData(NAME, 'test-1');
        await storage.appendData(NAME, 'test-2');
        await storage.appendData(NAME, 'test-3');

        const content = fs.readFileSync(path.resolve(BASE_PATH, `${NAME}.json`)).toString();
        expect(content).toEqual(`test-1\ntest-2\ntest-3\n`);
    });

    it('should remove file after usage', async () => {
        await storage.appendData(NAME, 'test-1');
        expect(fs.existsSync(path.resolve(BASE_PATH, `${NAME}.json`))).toBeTruthy();
        await storage.removeFile(NAME);
        expect(fs.existsSync(path.resolve(BASE_PATH, `${NAME}.json`))).toBeFalsy();
    });

    it('should read data from the file', async () => {
        await storage.appendData(NAME, 'test-1');
        await storage.appendData(NAME, 'test-2');
        const content = await storage.getData(NAME);
        expect(content).toStrictEqual(['test-1', 'test-2']);
    });

    it('should return empty list when file does not exist', async () => {
        const content = await storage.getData('xyz-42');
        expect(content).toStrictEqual([]);
    });
});