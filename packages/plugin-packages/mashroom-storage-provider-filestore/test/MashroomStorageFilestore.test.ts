
import fs from 'fs';
import path from 'path';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';

import MashroomStorageFilestore from '../src/storage/MashroomStorageFilestore';

describe('MashroomStorageFilestore', () => {

    it('creates a db file for a collection', () => {
        const dataFolder = path.resolve(__dirname, './test-data');
        const dbFile = path.resolve(dataFolder, 'users.json');
        if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
        const storage = new MashroomStorageFilestore(dataFolder, '.', -1, true, dummyLoggerFactory);

        const usersCollection = storage.getCollection('users');

        expect(usersCollection).not.toBe(null);
    });

});

