// @flow
import fs from 'fs';
import path from 'path';
import TemporaryFileStore from '../src/backend/webapp/tempStore';

const BASE_PATH = '/tmp';
const NAME = 'user_42';

describe('Tmp File Storage', () => {
    const logger = {
        warn: console.log,
    };
    const storage = new TemporaryFileStore(BASE_PATH, logger);

    afterAll(async () => {
        return storage.removeFile(NAME);
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