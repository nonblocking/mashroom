
import {Db, MongoClient} from 'mongodb';

let _connectionUri: string | null = null;
let _client: MongoClient | null = null;
let _db: Db | null = null;

export const close = async () => {
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

export const setConnectionUri = async (connectionUri: string) => {
    await close();
    _connectionUri = connectionUri;
};

export default async (): Promise<Db> => {
    if (_db) {
        return _db;
    }
    if (!_connectionUri) {
        throw new Error('No connection URI set!');
    }

    _client = new MongoClient(_connectionUri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });

    await _client.connect();

    _db = _client.db();
    return _db;
};

