
import {connect} from 'rhea';
import {topicToRoutingKey, routingKeyToTopic} from './topic_converter';

import type {Connection, EventContext} from 'rhea';
import type {
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {MashroomExternalMessageListener} from '@mashroom/mashroom-messaging/type-definitions';
import type {MashroomMessagingExternalProviderAMQP as MashroomMessagingExternalProviderAMQPType} from '../../type-definitions';

const RECONNECT_LIMIT = 100;
const RECONNECT_DELAY_MS = 5000;
const SINGLE_WORD_WILDCARD = '*';

export default class MashroomMessagingExternalProviderAMQP implements MashroomMessagingExternalProviderAMQPType {

    private _client: Connection | null;
    private _listeners: Array<MashroomExternalMessageListener>;
    private _logger: MashroomLogger;

    constructor(private _internalRoutingKey: string, private _brokerTopicExchangePrefix: string, private _brokerTopicMatchAny: string,
                private _brokerHost: string, private _brokerPort: number, private _brokerUsername: string | undefined, private _brokerPassword: string | undefined,
                loggerFactory: MashroomLoggerFactory) {
        this._client = null;
        this._listeners = [];
        this._logger = loggerFactory('mashroom.messaging.provider.amqp');

        if (!this._internalRoutingKey) {
            throw new Error('Internal routing key must not be empty!');
        }
        if (this._internalRoutingKey.indexOf('/') !== -1) {
            throw new Error('Internal routing key must not contain slashes, please use dots to separate the words!');
        }
        if (this._internalRoutingKey.indexOf(SINGLE_WORD_WILDCARD) !== -1 || this._internalRoutingKey.indexOf(this._brokerTopicMatchAny) !== -1) {
            throw new Error('Internal routing key must not contain wildcards!');
        }
    }

    subscribeToInternalTopic(): void {
        this._createClient();
        if (this._client) {
            const address = `${this._brokerTopicExchangePrefix}${this._internalRoutingKey}.${this._brokerTopicMatchAny}`;
            this._logger.info(`Subscribing AMQP address: ${address}`);
            const receiver = this._client.open_receiver({
                autoaccept: false,
                source: {
                    address,
                    durable: 0,
                    expiry_policy: 'session-end',
                }
            });
            receiver.on('message', (context: EventContext) => {
                this._processReceivedMessage(context);
            });
        }
    }

    unsubscribeFromInternalTopic(): void {
        if (this._client) {
            this._client.close();
        }
        this._client = null;
    }

    addMessageListener(listener: MashroomExternalMessageListener): void {
        this._listeners.push(listener);
    }

    removeMessageListener(listener: MashroomExternalMessageListener): void {
        this._listeners = this._listeners.filter((l) => l !== listener);
    }

    async sendInternalMessage(topic: string, message: any): Promise<void> {
        const routingKey = topicToRoutingKey(topic);
        const fullRoutingKey = `${this._internalRoutingKey}.${routingKey}`;
        return this._send(fullRoutingKey, message);
    }

    async sendExternalMessage(topic: string, message: any): Promise<void> {
        const routingKey = topicToRoutingKey(topic);
        return this._send(routingKey, message);
    }

    getClient(): Connection | null {
        return this._client;
    }

    private async _send(routingKey: string, message: any): Promise<void> {
        this._logger.debug(`Publishing message for routing key: ${routingKey}, Message:`, message);

        return new Promise((resolve, reject) => {
            if (!this._client) {
                reject('Connection to AMQP broker lost!');
                return;
            }
            const sender = this._client.open_sender({
                target: {
                    address: `${this._brokerTopicExchangePrefix}${routingKey}`
                }
            });
            sender.on('sendable', () => {
                sender.send({
                    subject: routingKey,
                    body: JSON.stringify(message)
                });
                sender.close();
                resolve();
            });
            sender.on('error', (error) => {
                reject(error);
            });
        });
    }

    private _processReceivedMessage(context: EventContext): void {
        const { message: { subject: routingKey = null, body = null } = {}, delivery } = context;

        if (!routingKey) {
            this._logger.error('Ignoring message without a subject property (should contain routing key): ', context.message);
            return;
        }

        if (routingKey.startsWith(`${this._internalRoutingKey}.`)) {
            let jsonMessage: any;
            if (body) {
                if (!body.typecode) {
                    // Plain
                    if (typeof (body) === 'string') {
                        try {
                            jsonMessage = JSON.parse(body);
                        } catch (error) {
                            this._logger.error(`Processing of the received message failed: Topic: ${routingKey}, Message:`, body, error);
                        }
                    } else if (typeof (body) === 'object') {
                        jsonMessage = body;
                    }
                } else if (body.typecode === 0x75 && !body.multiple) {
                    // Single data section (Buffer)
                    try {
                        jsonMessage = JSON.parse(body.content.toString());
                    } catch (error) {
                        this._logger.error(`Processing of the received message failed: Topic: ${routingKey}, Message:`, body, error);
                    }
                }
            }

            if (!jsonMessage) {
                this._logger.error('Ignoring unsupported message type (expecting JSON): ', context.message);
                return;
            }

            this._logger.debug(`Received message for routing key: ${routingKey}, Message:`, jsonMessage);
            if (delivery) {
                delivery.accept();
            }

            const internalRoutingKey = routingKey.substr(this._internalRoutingKey.length + 1);
            const internalTopic = routingKeyToTopic(internalRoutingKey);

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
        this._client = connect({
            port: this._brokerPort,
            host: this._brokerHost,
            username: this._brokerUsername,
            password: this._brokerPassword,
            reconnect: true,
            reconnect_limit: RECONNECT_LIMIT,
            initial_reconnect_delay: RECONNECT_DELAY_MS,
            max_reconnect_delay: RECONNECT_DELAY_MS,
        });

        this._client.on('error', (error) => {
            this._logger.error('AMQP broker client error:', error);
        });
        this._client.on('protocol_error', (error) => {
            this._logger.error('AMQP broker client error:', error);
        });
        this._client.on('connection_close', () => {
            this._logger.warn('Connection to AMQP broker closed (no reconnect!)');
        });
        this._client.on('disconnected', () => {
            // Ignore
        });
    }

}
