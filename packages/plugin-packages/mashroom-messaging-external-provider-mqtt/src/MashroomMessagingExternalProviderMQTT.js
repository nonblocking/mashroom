// @flow

import {connect} from 'mqtt';
import {containsWildcard} from '@mashroom/mashroom-utils/lib/messaging_utils';

import type {MqttClient} from 'mqtt';
import type {
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {MashroomExternalMessageListener} from '@mashroom/mashroom-messaging/type-definitions';
import type {MashroomMessagingExternalProviderMQTT as MashroomMessagingExternalProviderMQTTType} from '../type-definitions';

const CONNECT_TIMEOUT = 20000;
const RECONNECT_PERIOD = 5000;

export default class MashroomMessagingExternalProviderMQTT implements MashroomMessagingExternalProviderMQTTType {

    _internalTopic: string;
    _mqttConnectUrl: string;
    _mqttProtocolVersion: number;
    _mqttQoS: number;
    _mqttUser: ?string;
    _mqttPassword: ?string;
    _rejectUnauthorized: boolean;
    _logger: MashroomLogger;
    _client: ?MqttClient;
    _listeners: Array<MashroomExternalMessageListener>;

    constructor(internalTopic: string, mqttConnectUrl: string, mqttProtocolVersion: number, mqttQoS: number,
                mqttUser: ?string, mqttPassword: ?string, rejectUnauthorized: boolean, loggerFactory: MashroomLoggerFactory) {
        this._internalTopic = internalTopic;
        this._mqttConnectUrl = mqttConnectUrl;
        this._mqttProtocolVersion = mqttProtocolVersion;
        this._mqttQoS = mqttQoS;
        this._mqttUser = mqttUser;
        this._mqttPassword = mqttPassword;
        this._rejectUnauthorized = rejectUnauthorized;
        this._listeners = [];
        this._logger = loggerFactory('mashroom.messaging.provider.mqtt');

        if (!this._internalTopic) {
            throw new Error('Internal topic must not be empty!');
        }
        if (this._internalTopic.startsWith('/') || this._internalTopic.endsWith('/')) {
            throw new Error('Internal topic must not start or end with a slash!');
        }
        if (containsWildcard(this._internalTopic)) {
            throw new Error('Internal topic must not contain wildcards!');
        }
    }

    subscribeToInternalTopic() {
        this._createClient();
        const client = this._client;
        if (client) {
            const topic = `${this._internalTopic}/#`;
            this._logger.info(`Subscribing MQTT topic ${topic}`);
            client.subscribe(topic, {
                qos: this._mqttQoS
            }, (err) => {
                if (err) {
                    this._logger.error(`Subscribing MQTT topic ${topic} failed!`);
                }
            });
        }
    }

    unsubscribeFromInternalTopic() {
        if (this._client) {
            this._client.end();
            this._client = null;
        }
    }

    addMessageListener(listener: MashroomExternalMessageListener) {
        this._listeners.push(listener);
    }

    removeMessageListener(listener: MashroomExternalMessageListener) {
        this._listeners = this._listeners.filter((l) => l !== listener);
    }

    async sendInternalMessage(topic: string, message: any) {
        const fullTopic = `${this._internalTopic}/${topic}`;
        await this.sendExternalMessage(fullTopic, message);
    }

    async sendExternalMessage(topic: string, message: any) {
        const client = this._client;
        if (!client) {
            return;
        }

        this._logger.debug(`Publishing message for Topic: ${topic}, Message:`, message);
        const data = Buffer.from(JSON.stringify(message), 'utf-8');
        return new Promise((resolve, reject) => {
            client.publish(topic, data, {
                qos: this._mqttQoS
            }, (err) => {
                if (err) {
                    this._logger.error('Publishing message to MQTT failed', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    _processReceivedMessage(topic: string, data: Buffer | string) {
        if (topic.startsWith(`${this._internalTopic}/`)) {
            const internalTopic = topic.substr(this._internalTopic.length + 1);
            let jsonMessage = null;
            try {
                let message: ?string = null;
                if (Buffer.isBuffer(data)) {
                    // $FlowFixMe
                    message = data.toString('utf-8');
                } else if (typeof (data) === 'string') {
                    message = data;
                } else {
                    throw new Error('Unexpected payload type: ' + typeof (data));
                }
                jsonMessage = JSON.parse(message);
            } catch (e) {
                this._logger.error(`Processing of the received message failed: Topic: ${topic}, Message:`, data);
                return;
            }

            this._logger.debug(`Received message for Topic: ${topic}, Message:`, jsonMessage);

            this._listeners.forEach((listener) => {
               setTimeout(() => {
                   try {
                       listener(internalTopic, jsonMessage);

                   } catch (e) {
                       this._logger.error('Message listener threw error', e);
                   }
               }, 0);
            });
        }
    }

    _createClient() {
        const client = connect(this._mqttConnectUrl, {
            connectTimeout: CONNECT_TIMEOUT,
            reconnectPeriod: RECONNECT_PERIOD,
            rejectUnauthorized: this._rejectUnauthorized,
            protocolVersion: this._mqttProtocolVersion,
            username: this._mqttUser,
            password: this._mqttPassword,
        });

        client.on('message', this._processReceivedMessage.bind(this));

        client.on('connect', () => {
            this._logger.info('Successfully connected to MQTT server');
        });
        client.on('reconnect', () => {
            this._logger.warn('Connection lost. Try to reconnect to MQTT server...');
        });
        client.on('error', (err) => {
            this._logger.error('Error', err);
        });
        client.on('close', (err) => {
            this._logger.warn('Connection to MQTT server lost', err || '');
        });

        this._client = client;
    }

}
