
import {Db, MongoClient, Logger} from 'mongodb';

import type {MongoClientOptions} from 'mongodb';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

let _connectionUri: string | null = null;
let _connectionOptions: MongoClientOptions | null = null;
let _client: MongoClient | null = null;
let _db: Db | null = null;

export const close = async (): Promise<void> => {
    if (_client) {
        try {
            await _client.close();
        } catch (e) {
            //ignore
        }
    }
    _client = null;
    _db = null;
};

export const setConnectionUriAndOptions = async (connectionUri: string, options: MongoClientOptions): Promise<void> => {
    await close();
    _connectionUri = connectionUri;
    _connectionOptions = options;
};

export default async (logger: MashroomLogger): Promise<Db> => {
    if (_db) {
        return _db;
    }
    if (!_connectionUri) {
        throw new Error('No connection URI set!');
    }

    _client = new MongoClient(_connectionUri, _connectionOptions || {});

    await _client.connect();

    // Redirect MongoDB logger
    Logger.setLevel('info');
    Logger.setCurrentLogger((msg, context) => {
        if (context && context.type === 'info') {
            logger.info('MongoDB:', msg);
        } else {
            logger.error('MongoDB:', msg);
        }
    });

    _db = _client.db();
    return _db;
};

