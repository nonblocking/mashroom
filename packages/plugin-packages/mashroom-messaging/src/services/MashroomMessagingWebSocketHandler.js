// @flow

import {userContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import {WEBSOCKET_CONNECT_PATH} from './constants';

import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomWebSocketClient, MashroomWebSocketService} from '@mashroom/mashroom-websocket/type-definitions';
import type {
    MashroomMessagingInternalService,
    MashroomMessagingSubscriberCallback,
    MashroomMessagingWebSocketErrorResponse,
    MashroomMessagingWebSocketHandler as MashroomMessagingWebSocketHandlerType,
    MashroomMessagingWebSocketPublishMessage,
    MashroomMessagingWebSocketPublishRequest,
    MashroomMessagingWebSocketSubscribeRequest,
    MashroomMessagingWebSocketSuccessResponse,
    MashroomMessagingWebSocketUnsubscribeRequest
} from '../../type-definitions';

const WEBSOCKET_SERVICE_PLUGIN_NAME = 'Mashroom WebSocket Services';
const WEBSOCKET_MESSAGE_MATCHER = (path: string) => path === WEBSOCKET_CONNECT_PATH;

type ClientMap = Map<MashroomWebSocketClient, {
    subscriptions: Array<{
        topic: string,
        callback: MashroomMessagingSubscriberCallback,
    }>
}>

export default class MashroomMessagingWebSocketHandler implements MashroomMessagingWebSocketHandlerType {

    _messagingService: MashroomMessagingInternalService;
    _pluginContextHolder: MashroomPluginContextHolder;
    _webSocketService: ?MashroomWebSocketService;
    _clients: ClientMap;
    _logger: MashroomLogger;
    _started: boolean;
    _boundMessageHandler: (message: any, client: MashroomWebSocketClient) => void;
    _boundDisconnectHandler: (client: MashroomWebSocketClient) => void;

    constructor(messagingService: MashroomMessagingInternalService, pluginContextHolder: MashroomPluginContextHolder) {
        this._messagingService = messagingService;
        this._pluginContextHolder = pluginContextHolder;
        this._webSocketService = null;
        this._clients = new Map();
        this._logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.messaging.service.websocket');
        this._started = false;
        this._boundMessageHandler = this._handleMessage.bind(this);
        this._boundDisconnectHandler = this._handleDisconnect.bind(this);

        this._lookupWebSocketService();
    }

    startListeners() {
        this._addWebSocketListeners();
        this._started = true;
    }

    stopListeners() {
        this._removeWebSocketListeners();
        this._started = false;
    }

    _handleMessage(message: any, client: MashroomWebSocketClient) {
        const contextLogger = this._logger.withContext(userContext(client.user));

        if (!this._clients.get(client)) {
            contextLogger.debug(`Registering new WebSocket client for user: ${client.user.username}`);
            this._clients.set(client, {
                subscriptions: [],
            });
        }

        contextLogger.debug(`Received message via WebSocket from user ${client.user.username}:`, message);
        if (!message || !message.messageId || !message.command) {
            contextLogger.warn('Ignoring invalid message: ', message);
            return;
        }

        if (message.command === 'subscribe') {
            this._processSubscribe(message, client);
        } else if (message.command === 'unsubscribe') {
            this._processUnsubscribe(message, client);
        } else if (message.command === 'publish') {
            this._processPublish(message, client);
        }
    }

    _processSubscribe(request: MashroomMessagingWebSocketSubscribeRequest, client: MashroomWebSocketClient) {
        const contextLogger = this._logger.withContext(userContext(client.user));

        const clientData = this._clients.get(client);
        if (!clientData) {
            // Just to satisfy flow, cannot happen
            return;
        }
        if (clientData.subscriptions.find((s) => s.topic === request.topic)) {
            contextLogger.info(`Topic already subscribed: ${request.topic}`);
            this._sendSuccessResponse(request.messageId, client);
            return;
        }

        const callback: MashroomMessagingSubscriberCallback = (data: any, topic: string) => {
            contextLogger.debug(`Sending message for topic ${topic} via WebSocket to user ${client.user.username}`, data);
            this._sendMessage(topic, data, client);
        };
        this._messagingService.subscribe(client.user, request.topic, callback).then(
            () => {
                clientData.subscriptions.push({
                    topic: request.topic,
                    callback,
                });
                this._sendSuccessResponse(request.messageId, client);
            },
            (error) => {
                contextLogger.error(`Subscribing to topic ${request.topic} failed`, error);
                this._sendErrorResponse(request.messageId, `Subscribing to topic ${request.topic} failed`, client);
            }
        );
    }

    _processUnsubscribe(request: MashroomMessagingWebSocketUnsubscribeRequest, client: MashroomWebSocketClient) {
        const contextLogger = this._logger.withContext(userContext(client.user));

        const clientData = this._clients.get(client);
        if (!clientData) {
            // Just to satisfy flow, cannot happen
            return;
        }
        const existingSubscription = clientData.subscriptions.find((s) => s.topic === request.topic);
        if (!existingSubscription) {
            contextLogger.debug(`Cannot unsubscribe because topic is not subscribed: ${request.topic}`);
            this._sendErrorResponse(request.messageId, `Unsubscribing from topic ${request.topic} failed`, client);
            return;
        }

        this._messagingService.unsubscribe(existingSubscription.topic, existingSubscription.callback).then(
            () => {
                clientData.subscriptions = clientData.subscriptions.filter((s) => s !== existingSubscription);
                this._sendSuccessResponse(request.messageId, client);
            },
            (error) => {
                contextLogger.error(`Unsubscribing from topic ${request.topic} failed`, error);
                this._sendErrorResponse(request.messageId, `Unsubscribing from topic ${request.topic} failed`, client);
            }
        );
    }

    _processPublish(request: MashroomMessagingWebSocketPublishRequest, client: MashroomWebSocketClient) {
        const contextLogger = this._logger.withContext(userContext(client.user));

        this._messagingService.publish(client.user, request.topic, request.message).then(
            () => {
                this._sendSuccessResponse(request.messageId, client);
            },
            (error) => {
                contextLogger.error(`Publishing message to topic ${request.topic} failed`, error);
                this._sendErrorResponse(request.messageId, `Publishing message to topic ${request.topic} failed`, client);
            }
        )
    }

    _sendMessage(topic: string, message: any, client: MashroomWebSocketClient) {
        if (this._webSocketService) {
            const response: MashroomMessagingWebSocketPublishMessage = {
                remoteMessage: true,
                topic,
                message,
            };
            this._webSocketService.sendMessage(client, response).then(
                () => {},
                (error) => {
                    this._logger.error('Sending message failed', error);
                }
            )
        }
    }

    _sendSuccessResponse(messageId: string, client: MashroomWebSocketClient) {
        const webSocketService = this._webSocketService;
        if (webSocketService) {
            const contextLogger = this._logger.withContext(userContext(client.user));

            const response: MashroomMessagingWebSocketSuccessResponse = {
                messageId,
                success: true,
            };
            contextLogger.debug('Sending success message', response);
            webSocketService.sendMessage(client, response).then(
                () => {},
                (error) => {
                    this._logger.error('Sending success message failed', error);
                }
            )
        }
    }

    _sendErrorResponse(messageId: string, message: string, client: MashroomWebSocketClient) {
        const webSocketService = this._webSocketService;
        if (webSocketService) {
            const contextLogger = this._logger.withContext(userContext(client.user));

            const response: MashroomMessagingWebSocketErrorResponse = {
                messageId,
                error: true,
                message,
            };
            contextLogger.debug('Sending error message', response);
            webSocketService.sendMessage(client, response).then(
                () => {},
                (error) => {
                    this._logger.error('Sending error message failed', error);
                }
            )
        }
    }

    _handleDisconnect(client: MashroomWebSocketClient) {
        const clientData = this._clients.get(client);
        if (clientData) {
            this._logger.debug(`Removing WebSocket client from user: ${client.user.username}. Subscriptions: `,
                clientData.subscriptions.map((s) => s.topic).join(', '));
            clientData.subscriptions.forEach((s) => this._messagingService.unsubscribe(s.topic, s.callback));
            this._clients.delete(client);
        }
    }

    _addWebSocketListeners() {
        const webSocketService = this._webSocketService;
        if (webSocketService) {
            this._logger.info('Activating WebSocket support');
            webSocketService.addMessageListener(WEBSOCKET_MESSAGE_MATCHER, this._boundMessageHandler);
            webSocketService.addDisconnectListener(this._boundDisconnectHandler);
        } else {
            this._logger.warn('Cannot activate WebSocket support because mashroom-websocket is not loaded');
        }
    }

    _removeWebSocketListeners() {
        const webSocketService = this._webSocketService;
        if (webSocketService && this._started) {
            this._logger.info('Deactivating WebSocket support');
            webSocketService.removeMessageListener(WEBSOCKET_MESSAGE_MATCHER, this._boundMessageHandler);
            webSocketService.removeDisconnectListener(this._boundDisconnectHandler);
            this._clients.forEach((data, client) => {
                webSocketService.close(client);
            });
        }
    }

    _onWebSocketProviderLoad() {
        this._webSocketService = this._pluginContextHolder.getPluginContext().services.websocket.service;
        if (this._started) {
            this._addWebSocketListeners();
        }
        this._getPluginService().onLoadedOnce(WEBSOCKET_SERVICE_PLUGIN_NAME, () => this._onWebSocketProviderLoad());
    }

    _onWebSocketProviderUnload() {
        if (this._started) {
            this._removeWebSocketListeners();
            this._webSocketService = null;
        }
        this._getPluginService().onUnloadOnce(WEBSOCKET_SERVICE_PLUGIN_NAME, () => this._onWebSocketProviderUnload());
    }

    _lookupWebSocketService() {
        if (this._pluginContextHolder.getPluginContext().services.websocket) {
            this._webSocketService = this._pluginContextHolder.getPluginContext().services.websocket.service;
        }
        this._getPluginService().onLoadedOnce(WEBSOCKET_SERVICE_PLUGIN_NAME, () => this._onWebSocketProviderLoad());
        this._getPluginService().onUnloadOnce(WEBSOCKET_SERVICE_PLUGIN_NAME, () => this._onWebSocketProviderUnload());
    }

    _getPluginService() {
        return this._pluginContextHolder.getPluginContext().services.core.pluginService;
    }
}
