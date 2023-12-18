

import {messagingUtils} from '@mashroom/mashroom-utils';
import {getSubscriberClient, getPublisherClient, close} from '../redis_client';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomExternalMessageListener} from '@mashroom/mashroom-messaging/type-definitions';
import type {MashroomMessagingExternalProviderRedis as MashroomMessagingExternalProviderRedisType} from '../../type-definitions';

export default class MashroomMessagingExternalProviderRedis implements MashroomMessagingExternalProviderRedisType {

    private _logger: MashroomLogger;
    private _listeners: Array<MashroomExternalMessageListener>;

    constructor(private _internalTopic: string, loggerFactory: MashroomLoggerFactory) {
        if (!_internalTopic) {
            throw new Error('Internal topic must not be empty!');
        }
        if (_internalTopic.startsWith('/') || _internalTopic.endsWith('/')) {
            throw new Error('Internal topic must not start or end with a slash!');
        }
        if (messagingUtils.containsWildcard(_internalTopic)) {
            throw new Error('Internal topic must not contain wildcards!');
        }

        this._listeners = [];
        this._logger = loggerFactory('mashroom.messaging.provider.redis');
    }

    async start(): Promise<void> {
        const client = await getSubscriberClient(this._logger);
        const topic = `${this._internalTopic}/*`;
        this._logger.info(`Subscribing Redis topic ${topic}`);
        client.psubscribe(topic, (err) => {
            if (err) {
                this._logger.error(`Subscribing Redis topic ${topic} failed!`);
            }
        });
        client.on('pmessage', this._processReceivedMessage.bind(this));
    }

    async shutdown(): Promise<void> {
        await close();
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
        const client = await getPublisherClient(this._logger);
        this._logger.debug(`Publishing message for Topic: ${topic}, Message:`, message);
        const data = JSON.stringify(message);
        return new Promise((resolve, reject) => {
            client.publish(topic, data, (err) => {
                if (err) {
                    this._logger.error('Publishing message to Redis failed', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private _processReceivedMessage(pattern: string, topic: string, data: string): void {
        if (topic.startsWith(`${this._internalTopic}/`)) {
            const internalTopic = topic.substr(this._internalTopic.length + 1);
            let jsonMessage: any = null;
            try {
                jsonMessage = JSON.parse(data);
            } catch (e) {
                this._logger.error(`Processing of the received message failed: Topic: ${topic}, Message:`, data, e);
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


}
