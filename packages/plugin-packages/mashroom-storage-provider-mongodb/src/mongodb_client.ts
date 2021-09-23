
import {Db, MongoClient, Logger} from 'mongodb';

import type {MongoClientOptions} from 'mongodb';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

let _connectionUri: string | null = null;
let _connectionOptions: MongoClientOptions | null = null;
let _client: MongoClient | null = null;
let _db: Db | null = null;
let _connected = false;

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

export const getClient = (): MongoClient | null => {
    return _client;
}

export const isConnected = (): boolean => {
    return _connected;
}

export default async (logger: MashroomLogger): Promise<Db> => {
    if (_db) {
        return _db;
    }
    if (!_connectionUri) {
        throw new Error('No connection URI set!');
    }

    _client = new MongoClient(_connectionUri, _connectionOptions || {});

    _client.on('open', () => {
        logger.info('MongoDB: Connection opened');
        _connected = true;
    });
    _client.on('close', () => {
        logger.info('MongoDB: Connection closed');
        _connected = false;
    });
    _client.on('error', (event) => {
        logger.error('MongoDB: Error:', event);
    });

    _client.on('serverDescriptionChanged', (event) => {
        logger.debug('MongoDB:', event);
    });
    _client.on('serverHeartbeatSucceeded', (event) => {
        if (!_connected) {
            _connected = true;
            logger.info('MongoDB: Reconnected to cluster: ', event);
        } else {
            logger.debug('MongoDB:', event);
        }
    });
    _client.on('serverHeartbeatFailed', (event) => {
        logger.error('MongoDB: Disconnected from cluster: ', event);
        _connected = false;
    });

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

