
import {Db, MongoClient} from 'mongodb';

let _connectionUri: string | null = null;
let _client: Db | null = null;

export const setConnectionUri = (connectionUri: string) => {
    _connectionUri = connectionUri;
    _client = null;
};

export default async (): Promise<Db> => {
    if (_client) {
        return _client;
    }
    if (!_connectionUri) {
        throw new Error('No connection URI set!');
    }

    const mongoClient = new MongoClient(_connectionUri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });

    await mongoClient.connect();

    _client = mongoClient.db();
    return _client;
};

