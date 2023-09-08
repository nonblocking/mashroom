
import {MongoClient} from 'mongodb';

import type {MongoClientOptions, TopologyDescription,Db} from 'mongodb';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

let _connectionUri: string | null = null;
let _connectionOptions: MongoClientOptions | null = null;
let _client: MongoClient | null = null;
let _db: Db | null = null;
let _topologyDescription: TopologyDescription | undefined;

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
};

export const getAvailableNodes = () => {
    if (!_topologyDescription) {
        return 0;
    }
    let availableNodes = 0;
    _topologyDescription.servers.forEach((server) => {
        if (server.type !== 'Unknown' && !server.error) {
            availableNodes ++;
        }
    });
    return availableNodes;
};

export const isConnected = () => {
    return getAvailableNodes() > 0;
};

export const getDb = async (logger: MashroomLogger): Promise<Db> => {
    if (_db) {
        return _db;
    }
    if (!_connectionUri) {
        throw new Error('No connection URI set!');
    }

    _client = new MongoClient(_connectionUri, _connectionOptions || {});

    _client.on('open', () => {
        logger.info('MongoDB: Connection opened');
    });
    _client.on('close', () => {
        logger.info('MongoDB: Connection closed');
    });
    _client.on('error', (event) => {
        logger.error('MongoDB: Error:', event);
    });

    _client.on('topologyDescriptionChanged', (event) => {
        logger.info('MongoDB: New topology description:', event.newDescription);
        _topologyDescription = event.newDescription;
    });

    await _client.connect();

    _db = _client.db();

    return _db;
};


