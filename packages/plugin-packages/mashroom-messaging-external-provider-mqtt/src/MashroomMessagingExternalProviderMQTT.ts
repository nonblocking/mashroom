
import {connect} from 'mqtt';

// @ts-ignore
import {containsWildcard} from '@mashroom/mashroom-utils/lib/messaging_utils';

import type {MqttClient, QoS} from 'mqtt';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomExternalMessageListener} from '@mashroom/mashroom-messaging/type-definitions';
import type {MashroomMessagingExternalProviderMQTT as MashroomMessagingExternalProviderMQTTType} from '../type-definitions';

const CONNECT_TIMEOUT = 20000;
const RECONNECT_PERIOD = 5000;

export default class MashroomMessagingExternalProviderMQTT implements MashroomMessagingExternalProviderMQTTType {

    private readonly logger: MashroomLogger;
    private client: MqttClient | undefined;
    private listeners: Array<MashroomExternalMessageListener>;

    constructor(private internalTopic: string, private mqttConnectUrl: string, private mqttProtocolVersion: number, private mqttQoS: QoS,
                private mqttUser: string | undefined, private mqttPassword: string | undefined,
                private rejectUnauthorized: boolean, loggerFactory: MashroomLoggerFactory) {
        if (!internalTopic) {
            throw new Error('Internal topic must not be empty!');
        }
        if (internalTopic.startsWith('/') || internalTopic.endsWith('/')) {
            throw new Error('Internal topic must not start or end with a slash!');
        }
        if (containsWildcard(internalTopic)) {
            throw new Error('Internal topic must not contain wildcards!');
        }

        this.listeners = [];
        this.logger = loggerFactory('mashroom.messaging.provider.mqtt');
    }

    subscribeToInternalTopic(): void {
        this._createClient();
        const client = this.client;
        if (client) {
            const topic = `${this.internalTopic}/#`;
            this.logger.info(`Subscribing MQTT topic ${topic}`);
            client.subscribe(topic, {
                qos: this.mqttQoS
            }, (err) => {
                if (err) {
                    this.logger.error(`Subscribing MQTT topic ${topic} failed!`);
                }
            });
        }
    }

    unsubscribeFromInternalTopic(): void {
        if (this.client) {
            this.client.end();
            this.client = undefined;
        }
    }

    addMessageListener(listener: MashroomExternalMessageListener): void {
        this.listeners.push(listener);
    }

    removeMessageListener(listener: MashroomExternalMessageListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    async sendInternalMessage(topic: string, message: any): Promise<void> {
        const fullTopic = `${this.internalTopic}/${topic}`;
        await this.sendExternalMessage(fullTopic, message);
    }

    async sendExternalMessage(topic: string, message: any): Promise<void> {
        const client = this.client;
        if (!client) {
            return;
        }

        this.logger.debug(`Publishing message for Topic: ${topic}, Message:`, message);
        const data = Buffer.from(JSON.stringify(message), 'utf-8');
        return new Promise((resolve, reject) => {
            client.publish(topic, data, {
                qos: this.mqttQoS
            }, (err) => {
                if (err) {
                    this.logger.error('Publishing message to MQTT failed', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    _processReceivedMessage(topic: string, data: Buffer | string | any): void {
        if (topic.startsWith(`${this.internalTopic}/`)) {
            const internalTopic = topic.substr(this.internalTopic.length + 1);
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
                this.logger.error(`Processing of the received message failed: Topic: ${topic}, Message:`, data);
                return;
            }

            this.logger.debug(`Received message for Topic: ${topic}, Message:`, jsonMessage);

            this.listeners.forEach((listener) => {
                setTimeout(() => {
                    try {
                        listener(internalTopic, jsonMessage);

                    } catch (e) {
                        this.logger.error('Message listener threw error', e);
                    }
                }, 0);
            });
        }
    }

    _createClient(): void {
        const client = connect(this.mqttConnectUrl, {
            connectTimeout: CONNECT_TIMEOUT,
            reconnectPeriod: RECONNECT_PERIOD,
            rejectUnauthorized: this.rejectUnauthorized,
            protocolVersion: this.mqttProtocolVersion,
            username: this.mqttUser,
            password: this.mqttPassword,
        });

        client.on('message', this._processReceivedMessage.bind(this));

        client.on('connect', () => {
            this.logger.info('Successfully connected to MQTT server');
        });
        client.on('reconnect', () => {
            this.logger.warn('Connection lost. Try to reconnect to MQTT server...');
        });
        client.on('error', (err) => {
            this.logger.error('Error', err);
        });
        client.on('close', (err: any) => {
            this.logger.warn('Connection to MQTT server lost', err || '');
        });

        this.client = client;
    }

}
