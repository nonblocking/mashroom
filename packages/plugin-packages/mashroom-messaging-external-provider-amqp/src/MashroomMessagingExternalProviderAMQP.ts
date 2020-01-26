/* eslint @typescript-eslint/camelcase: off */

import {connect, Connection, EventContext} from 'rhea';
import {topicToRoutingKey, routingKeyToTopic} from './topic_converter';

import {
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import {MashroomExternalMessageListener} from '@mashroom/mashroom-messaging/type-definitions';
import {MashroomMessagingExternalProviderAMQP as MashroomMessagingExternalProviderAMQPType} from '../type-definitions';

const RECONNECT_LIMIT = 100;
const RECONNECT_DELAY_MS = 5000;
const SINGLE_WORD_WILDCARD = '*';

export default class MashroomMessagingExternalProviderAMQP implements MashroomMessagingExternalProviderAMQPType {

    private connection: Connection | null;
    private listeners: Array<MashroomExternalMessageListener>;
    private logger: MashroomLogger;

    constructor(private internalRoutingKey: string, private brokerTopicExchangePrefix: string, private brokerTopicMatchAny: string,
                private brokerHost: string, private brokerPort: number, private brokerUsername: string | undefined, private brokerPassword: string | undefined,
                loggerFactory: MashroomLoggerFactory) {
        this.connection = null;
        this.listeners = [];
        this.logger = loggerFactory('mashroom.messaging.provider.amqp');

        if (!this.internalRoutingKey) {
            throw new Error('Internal routing key must not be empty!');
        }
        if (this.internalRoutingKey.indexOf('/') !== -1) {
            throw new Error('Internal routing key must not contain slashes, please use dots to separate the words!');
        }
        if (this.internalRoutingKey.indexOf(SINGLE_WORD_WILDCARD) !== -1 || this.internalRoutingKey.indexOf(this.brokerTopicMatchAny) !== -1) {
            throw new Error('Internal routing key must not contain wildcards!');
        }
    }

    subscribeToInternalTopic(): void {
        this.createClient();
        if (this.connection) {
            const address = `${this.brokerTopicExchangePrefix}${this.internalRoutingKey}.${this.brokerTopicMatchAny}`;
            this.logger.info(`Subscribing AMQP address: ${address}`);
            const receiver = this.connection.open_receiver({
                autoaccept: false,
                source: {
                    address,
                    durable: 0,
                    expiry_policy: 'session-end',
                }
            });
            receiver.on('message', (context: EventContext) => {
                this.processReceivedMessage(context);
            });
        }
    }

    unsubscribeFromInternalTopic(): void {
        if (this.connection) {
            this.connection.close();
        }
        this.connection = null;
    }

    addMessageListener(listener: MashroomExternalMessageListener): void {
        this.listeners.push(listener);
    }

    removeMessageListener(listener: MashroomExternalMessageListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    async sendInternalMessage(topic: string, message: any): Promise<void> {
        const routingKey = topicToRoutingKey(topic);
        const fullRoutingKey = `${this.internalRoutingKey}.${routingKey}`;
        return this.send(fullRoutingKey, message);
    }

    async sendExternalMessage(topic: string, message: any): Promise<void> {
        const routingKey = topicToRoutingKey(topic);
        return this.send(routingKey, message);
    }

    private async send(routingKey: string, message: any): Promise<void> {
        this.logger.debug(`Publishing message for routing key: ${routingKey}, Message:`, message);

        return new Promise((resolve, reject) => {
            if (!this.connection) {
                reject('Connection to AMQP broker lost!');
                return;
            }
            const sender = this.connection.open_sender({
                target: {
                    address: `${this.brokerTopicExchangePrefix}${routingKey}`
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

    private processReceivedMessage(context: EventContext): void {
        const { message: { subject: routingKey = null, body = null } = {}, delivery } = context;

        if (!routingKey) {
            console.error('Ignoring message without a subject property (should contain routing key): ', context.message);
            return;
        }

        if (routingKey.startsWith(`${this.internalRoutingKey}.`)) {
            let jsonMessage: any;
            if (body) {
                if (!body.typecode) {
                    // Plain
                    if (typeof (body) === 'string') {
                        try {
                            jsonMessage = JSON.parse(body);
                        } catch (error) {
                            // Ignore parse error
                        }
                    } else if (typeof (body) === 'object') {
                        jsonMessage = body;
                    }
                } else if (body.typecode === 0x75 && !body.multiple) {
                    // Single data section (Buffer)
                    try {
                        jsonMessage = JSON.parse(body.content.toString());
                    } catch (error) {
                        // Ignore parse error
                    }
                }
            }

            if (!jsonMessage) {
                console.error('Ignoring unsupported message type (expecting JSON): ', context.message);
                return;
            }

            this.logger.debug(`Received message for routing key: ${routingKey}, Message:`, jsonMessage);
            if (delivery) {
                delivery.accept();
            }

            const internalRoutingKey = routingKey.substr(this.internalRoutingKey.length + 1);
            const internalTopic = routingKeyToTopic(internalRoutingKey);

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

    private createClient(): void {
        this.connection = connect({
            port: this.brokerPort,
            host: this.brokerHost,
            username: this.brokerUsername,
            password: this.brokerPassword,
            reconnect: true,
            reconnect_limit: RECONNECT_LIMIT,
            initial_reconnect_delay: RECONNECT_DELAY_MS,
            max_reconnect_delay: RECONNECT_DELAY_MS,
        });

        this.connection.on('error', (error) => {
            this.logger.error('AMQP broker connection error:', error);
        });
        this.connection.on('protocol_error', (error) => {
            this.logger.error('AMQP broker connection error:', error);
        });
        this.connection.on('connection_close', () => {
            this.logger.warn('Connection to AMQP broker closed (no reconnect!)');
        });
        this.connection.on('disconnected', () => {
            // Ignore
        });
    }

}
