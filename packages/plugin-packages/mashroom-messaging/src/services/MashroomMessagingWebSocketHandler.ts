
import {WEBSOCKET_CONNECT_PATH} from './constants';

import type {
    MashroomLogger,
    MashroomPluginContextHolder,
    MashroomPluginService
} from '@mashroom/mashroom/type-definitions';
import type {MashroomWebSocketClient, MashroomWebSocketService} from '@mashroom/mashroom-websocket/type-definitions';
import type {
    MashroomMessagingSubscriberCallback,
    MashroomMessagingWebSocketPublishMessage,
    MashroomMessagingWebSocketPublishRequest,
    MashroomMessagingWebSocketSubscribeRequest,
    MashroomMessagingWebSocketSuccessResponse,
    MashroomMessagingWebSocketUnsubscribeRequest,
    MashroomMessagingWebSocketErrorResponse,
} from '../../type-definitions';
import type {
    MashroomMessagingInternalService,
    MashroomMessagingWebSocketHandler as MashroomMessagingWebSocketHandlerType,
} from '../../type-definitions/internal';

const WEBSOCKET_SERVICE_PLUGIN_NAME = 'Mashroom WebSocket Services';
const WEBSOCKET_MESSAGE_MATCHER = (path: string) => path.startsWith(WEBSOCKET_CONNECT_PATH);

type ClientMap = Map<MashroomWebSocketClient, {
    subscriptions: Array<{
        topic: string,
        callback: MashroomMessagingSubscriberCallback,
    }>
}>

export default class MashroomMessagingWebSocketHandler implements MashroomMessagingWebSocketHandlerType {

    private webSocketService: MashroomWebSocketService | null;
    clients: ClientMap;
    private logger: MashroomLogger;
    private started: boolean;
    private boundMessageHandler: (message: any, client: MashroomWebSocketClient) => void;
    private boundDisconnectHandler: (client: MashroomWebSocketClient) => void;

    constructor(private messagingService: MashroomMessagingInternalService, private pluginContextHolder: MashroomPluginContextHolder) {
        this.webSocketService = null;
        this.clients = new Map();
        this.logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.messaging.service.websocket');
        this.started = false;
        this.boundMessageHandler = this.handleMessage.bind(this);
        this.boundDisconnectHandler = this.handleDisconnect.bind(this);

        this.lookupWebSocketService();
    }

    startListeners(): void {
        this.addWebSocketListeners();
        this.started = true;
    }

    stopListeners(): void {
        this.removeWebSocketListeners();
        this.started = false;
    }

    private handleMessage(message: any, client: MashroomWebSocketClient): void {
        const contextLogger = this.logger.withContext(client.loggerContext);

        if (!this.clients.get(client)) {
            contextLogger.debug(`Registering new WebSocket client for user: ${client.user.username}`);
            this.clients.set(client, {
                subscriptions: [],
            });
        }

        contextLogger.debug(`Received message via WebSocket from user ${client.user.username}:`, message);
        if (!message || !message.messageId || !message.command) {
            contextLogger.warn('Ignoring invalid message: ', message);
            return;
        }

        if (message.command === 'subscribe') {
            this.processSubscribe(message, client);
        } else if (message.command === 'unsubscribe') {
            this.processUnsubscribe(message, client);
        } else if (message.command === 'publish') {
            this.processPublish(message, client);
        }
    }

    private processSubscribe(request: MashroomMessagingWebSocketSubscribeRequest, client: MashroomWebSocketClient): void {
        const contextLogger = this.logger.withContext(client.loggerContext);

        const clientData = this.clients.get(client);
        if (!clientData) {
            // Just to satisfy flow, cannot happen
            return;
        }
        if (clientData.subscriptions.find((s) => s.topic === request.topic)) {
            contextLogger.info(`Topic already subscribed: ${request.topic}`);
            this.sendSuccessResponse(request.messageId, client);
            return;
        }

        const callback: MashroomMessagingSubscriberCallback = (data: any, topic: string) => {
            contextLogger.debug(`Sending message for topic ${topic} via WebSocket to user ${client.user.username}`, data);
            this.sendMessage(topic, data, client);
        };
        this.messagingService.subscribe(client.user, request.topic, callback).then(
            () => {
                clientData.subscriptions.push({
                    topic: request.topic,
                    callback,
                });
                this.sendSuccessResponse(request.messageId, client);
            },
            (error) => {
                contextLogger.error(`Subscribing to topic ${request.topic} failed`, error);
                this.sendErrorResponse(request.messageId, `Subscribing to topic ${request.topic} failed`, client);
            }
        );
    }

    private processUnsubscribe(request: MashroomMessagingWebSocketUnsubscribeRequest, client: MashroomWebSocketClient): void {
        const contextLogger = this.logger.withContext(client.loggerContext);

        const clientData = this.clients.get(client);
        if (!clientData) {
            // Just to satisfy flow, cannot happen
            return;
        }
        const existingSubscription = clientData.subscriptions.find((s) => s.topic === request.topic);
        if (!existingSubscription) {
            contextLogger.debug(`Cannot unsubscribe because topic is not subscribed: ${request.topic}`);
            this.sendErrorResponse(request.messageId, `Unsubscribing from topic ${request.topic} failed`, client);
            return;
        }

        this.messagingService.unsubscribe(existingSubscription.topic, existingSubscription.callback).then(
            () => {
                clientData.subscriptions = clientData.subscriptions.filter((s) => s !== existingSubscription);
                this.sendSuccessResponse(request.messageId, client);
            },
            (error) => {
                contextLogger.error(`Unsubscribing from topic ${request.topic} failed`, error);
                this.sendErrorResponse(request.messageId, `Unsubscribing from topic ${request.topic} failed`, client);
            }
        );
    }

    private processPublish(request: MashroomMessagingWebSocketPublishRequest, client: MashroomWebSocketClient): void {
        const contextLogger = this.logger.withContext(client.loggerContext);

        this.messagingService.publish(client.user, request.topic, request.message).then(
            () => {
                this.sendSuccessResponse(request.messageId, client);
            },
            (error) => {
                contextLogger.error(`Publishing message to topic ${request.topic} failed`, error);
                this.sendErrorResponse(request.messageId, `Publishing message to topic ${request.topic} failed`, client);
            }
        )
    }

    private sendMessage(topic: string, message: any, client: MashroomWebSocketClient): void {
        if (this.webSocketService) {
            const response: MashroomMessagingWebSocketPublishMessage = {
                remoteMessage: true,
                topic,
                message,
            };
            this.webSocketService.sendMessage(client, response).then(
                () => { /* nothing to do */ },
                (error) => {
                    this.logger.error('Sending message failed', error);
                }
            )
        }
    }

    private sendSuccessResponse(messageId: string, client: MashroomWebSocketClient): void {
        const webSocketService = this.webSocketService;
        if (webSocketService) {
            const contextLogger = this.logger.withContext(client.loggerContext);

            const response: MashroomMessagingWebSocketSuccessResponse = {
                messageId,
                success: true,
            };
            contextLogger.debug('Sending success message', response);
            webSocketService.sendMessage(client, response).then(
                () => { /* nothing to do */ },
                (error) => {
                    this.logger.error('Sending success message failed', error);
                }
            )
        }
    }

    private sendErrorResponse(messageId: string, message: string, client: MashroomWebSocketClient): void {
        const webSocketService = this.webSocketService;
        if (webSocketService) {
            const contextLogger = this.logger.withContext(client.loggerContext);

            const response: MashroomMessagingWebSocketErrorResponse = {
                messageId,
                error: true,
                message,
            };
            contextLogger.debug('Sending error message', response);
            webSocketService.sendMessage(client, response).then(
                () => { /* nothing to do */ },
                (error) => {
                    this.logger.error('Sending error message failed', error);
                }
            )
        }
    }

    private handleDisconnect(client: MashroomWebSocketClient): void {
        const clientData = this.clients.get(client);
        if (clientData) {
            this.logger.debug(`Removing WebSocket client from user: ${client.user.username}. Subscriptions: `,
                clientData.subscriptions.map((s) => s.topic).join(', '));
            clientData.subscriptions.forEach((s) => this.messagingService.unsubscribe(s.topic, s.callback));
            this.clients.delete(client);
        }
    }

    private addWebSocketListeners(): void {
        const webSocketService = this.webSocketService;
        if (webSocketService) {
            this.logger.info('Activating WebSocket support');
            webSocketService.addMessageListener(WEBSOCKET_MESSAGE_MATCHER, this.boundMessageHandler);
            webSocketService.addDisconnectListener(this.boundDisconnectHandler);
        } else {
            this.logger.warn(`Cannot activate WebSocket support because plugin ${WEBSOCKET_SERVICE_PLUGIN_NAME} is not loaded (yet)`);
        }
    }

    private removeWebSocketListeners(): void {
        const webSocketService = this.webSocketService;
        if (webSocketService && this.started) {
            this.logger.info('Deactivating WebSocket support');
            webSocketService.removeMessageListener(WEBSOCKET_MESSAGE_MATCHER, this.boundMessageHandler);
            webSocketService.removeDisconnectListener(this.boundDisconnectHandler);
            this.clients.forEach((data, client) => {
                webSocketService.close(client);
            });
        }
    }

    private onWebSocketProviderLoad(): void {
        this.webSocketService = this.pluginContextHolder.getPluginContext().services.websocket.service;
        if (this.started) {
            this.addWebSocketListeners();
        }
        this._getPluginService().onLoadedOnce(WEBSOCKET_SERVICE_PLUGIN_NAME, () => this.onWebSocketProviderLoad());
    }

    private onWebSocketProviderUnload(): void {
        if (this.started) {
            this.removeWebSocketListeners();
            this.webSocketService = null;
        }
        this._getPluginService().onUnloadOnce(WEBSOCKET_SERVICE_PLUGIN_NAME, () => this.onWebSocketProviderUnload());
    }

    private lookupWebSocketService(): void {
        if (this.pluginContextHolder.getPluginContext().services.websocket) {
            this.onWebSocketProviderLoad();
        } else {
            this._getPluginService().onLoadedOnce(WEBSOCKET_SERVICE_PLUGIN_NAME, () => this.onWebSocketProviderLoad());
        }
        this._getPluginService().onUnloadOnce(WEBSOCKET_SERVICE_PLUGIN_NAME, () => this.onWebSocketProviderUnload());
    }

    private _getPluginService(): MashroomPluginService {
        return this.pluginContextHolder.getPluginContext().services.core.pluginService;
    }
}
