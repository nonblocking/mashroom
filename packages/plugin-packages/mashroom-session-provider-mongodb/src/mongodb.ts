
import {MongoClient} from 'mongodb';

import type {MongoClientOptions, TopologyDescription} from 'mongodb';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

let _connectionUri: string | null = null;
let _connectionOptions: MongoClientOptions | null = null;
let _client: MongoClient | null = null;
let _lastHeartbeatSucceeded = false;

export const close = async (): Promise<void> => {
    if (_client) {
        try {
            await _client.close();
        } catch (e) {
            //ignore
        }
    }
    _client = null;
};

export const setConnectionUriAndOptions = async (connectionUri: string, options: MongoClientOptions): Promise<void> => {
    await close();
    _connectionUri = connectionUri;
    _connectionOptions = options;
};

const getTopology = (): TopologyDescription | undefined => {
    // @ts-ignore Accessing the private property topology
    return _client?.topology?.description;
};

export const getAvailableNodes = () => {
    const topology = getTopology();
    if (!topology) {
        // Fallback
        return _lastHeartbeatSucceeded ? 1 : 0;
    }
    let servers = 0;
    topology.servers.forEach((server) => {
        if (!server.error) {
            servers ++;
        }
    });
    return servers;
};

export const isConnected = () => {
    const availableNodes = getAvailableNodes();
    return availableNodes > 0;
};

export default async (logger: MashroomLogger): Promise<MongoClient> => {
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
    });

    _client.on('serverDescriptionChanged', (event) => {
        logger.info('MongoDB: New server description:', event.newDescription);
    });

    _client.on('serverHeartbeatSucceeded', (event) => {
        _lastHeartbeatSucceeded = true;
        logger.debug('MongoDB: Heartbeat succeeded:', event);
    });
    _client.on('serverHeartbeatFailed', (event) => {
        _lastHeartbeatSucceeded = false;
        logger.error('MongoDB: Heartbeat failed:', event);
    });

    await _client.connect();

    return _client;
};

