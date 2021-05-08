
import {connect} from 'mqtt';

import {containsWildcard} from '@mashroom/mashroom-utils/lib/messaging_utils';

import type {MqttClient, QoS} from 'mqtt';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomExternalMessageListener} from '@mashroom/mashroom-messaging/type-definitions';
import type {MashroomMessagingExternalProviderMQTT as MashroomMessagingExternalProviderMQTTType} from '../../type-definitions';

const CONNECT_TIMEOUT = 20000;
const RECONNECT_PERIOD = 5000;

export default class MashroomMessagingExternalProviderMQTT implements MashroomMessagingExternalProviderMQTTType {

    private _logger: MashroomLogger;
    private _client: MqttClient | undefined;
    private _listeners: Array<MashroomExternalMessageListener>;

    constructor(private _internalTopic: string, private _mqttConnectUrl: string, private _mqttProtocolVersion: number, private _mqttQoS: QoS,
                private _mqttUser: string | undefined, private _mqttPassword: string | undefined,
                private _rejectUnauthorized: boolean, loggerFactory: MashroomLoggerFactory) {
        if (!_internalTopic) {
            throw new Error('Internal topic must not be empty!');
        }
        if (_internalTopic.startsWith('/') || _internalTopic.endsWith('/')) {
            throw new Error('Internal topic must not start or end with a slash!');
        }
        if (containsWildcard(_internalTopic)) {
            throw new Error('Internal topic must not contain wildcards!');
        }

        this._listeners = [];
        this._logger = loggerFactory('mashroom.messaging.provider.mqtt');
    }

    subscribeToInternalTopic(): void {
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

    unsubscribeFromInternalTopic(): void {
        if (this._client) {
            this._client.end();
            this._client = undefined;
        }
    }

    addMessageListener(listener: MashroomExternalMessageListener): void {
        this._listeners.push(listener);
    }

    removeMessageListener(listener: MashroomExternalMessageListener): void {
        this._listeners = this._listeners.filter((l) => l !== listener);
    }

    async sendInternalMessage(topic: string, message: any): Promise<void> {
        const fullTopic = `${this._internalTopic}/${topic}`;
        await this.sendExternalMessage(fullTopic, message);
    }

    async sendExternalMessage(topic: string, message: any): Promise<void> {
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

    getClient(): MqttClient | undefined {
        return this._client;
    }

    private _processReceivedMessage(topic: string, data: Buffer | string | any): void {
        if (topic.startsWith(`${this._internalTopic}/`)) {
            const internalTopic = topic.substr(this._internalTopic.length + 1);
            let jsonMessage: any = null;
            try {
                let message: string | null = null;
                if (Buffer.isBuffer(data)) {
                    message = data.toString('utf-8');
                } else if (typeof (data) === 'string') {
                    message = data;
                } else {
                    throw new Error(`Unexpected payload type: ${typeof (data)}`);
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

    private _createClient(): void {
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
        client.on('close', (err: any) => {
            this._logger.warn('Connection to MQTT server lost', err || '');
        });

        this._client = client;
    }

}
