
import {nanoid} from 'nanoid';
import { SESSION_STORAGE_WS_CLIENT_ID } from '../../../backend/constants';

import type {
    MashroomMessagingWebSocketSubscribeRequest,
    MashroomMessagingWebSocketUnsubscribeRequest,
    MashroomMessagingWebSocketPublishRequest,
    MashroomMessagingWebSocketPublishMessage,
} from '@mashroom/mashroom-messaging/type-definitions';

export const webSocketSupport = 'WebSocket' in global;

const RESPONSE_TIMEOUT_MS = 2000;
const WEBSOCKET_READY_TIMEOUT_MS = 3000;
const CONNECT_RETRIES = 5;
const CONNECT_RETRY_TIMEOUT_MS = 3000;

type ResolveFn = () => void;
type RejectFn = (reason: any) => void;
type OpenPromise = {
    timestamp: number,
    messageId: string,
    resolve: ResolveFn,
    reject: RejectFn,
};

export default class RemoteMessagingClient {

    private _webSocket: WebSocket | undefined | null;
    private _connected: boolean;
    private _messageHandler: ((message: any, topic: string, subscriptionTopic: string) => void) | null;
    private _openPromises: Array<OpenPromise>;
    private _connectRetries: number;
    private _subscribedTopics: Array<string>;
    private _timer: ReturnType<typeof setTimeout> | undefined | null;
    private _cancelRetry: boolean;

    constructor(private _connectUrl: string) {
        this._webSocket = null;
        this._connected = false;
        this._messageHandler = null;
        this._openPromises = [];
        this._connectRetries = 0;
        this._subscribedTopics = [];
        this._cancelRetry = false;
        global.addEventListener('beforeunload', (event) => {
            this._cancelRetry = true;
        });
    }

    async subscribe(topic: string): Promise<void> {
        const subscribeRequest: MashroomMessagingWebSocketSubscribeRequest = {
            messageId: this._createId(),
            command: 'subscribe',
            topic,
        };
        await this._webSocketSend(subscribeRequest);
        if (this._subscribedTopics.indexOf(topic) === -1) {
            this._subscribedTopics.push(topic);
        }
    }

    async unsubscribe(topic: string): Promise<void> {
        const subscribeRequest: MashroomMessagingWebSocketUnsubscribeRequest = {
            messageId: this._createId(),
            command: 'unsubscribe',
            topic,
        };
        await this._webSocketSend(subscribeRequest);
        this._subscribedTopics = this._subscribedTopics.filter((t) => t !== topic);
    }

    publish(topic: string, message: any): Promise<void> {
        const subscribeRequest: MashroomMessagingWebSocketPublishRequest = {
            messageId: this._createId(),
            command: 'publish',
            topic,
            message,
        };
        return this._webSocketSend(subscribeRequest);
    }

    onMessage(handler: (message: any, topic: string, subscriptionPattern: string) => void): void {
        this._messageHandler = handler;
    }

    private _webSocketSend(message: any): Promise<void> {
        const messageId = message.messageId;
        if (!messageId) {
            return Promise.reject('Message has no messageId property!');
        }
        const webSocket = this._getWebSocket();
        if (webSocket) {
            return new Promise((resolve, reject) => {
                this._sendWhenReady(webSocket, Date.now(), messageId, JSON.stringify(message), resolve, reject);
            });
        }
        return Promise.reject('No WebSocket connection!');
    }

    private _sendWhenReady(webSocket: WebSocket, startTimestamp: number, messageId: string, message: string, resolve: ResolveFn, reject: RejectFn) {
        if (this._connected) {
            console.log('Sending WebSocket message:', message);
            webSocket.send(message);
            this._waitForResponseMessage(messageId, resolve, reject);
        } else if (startTimestamp < Date.now() - WEBSOCKET_READY_TIMEOUT_MS) {
            reject('WebSocket not connected');
        } else {
            console.info('Waiting for WebSocket connection...');
            setTimeout(() => this._sendWhenReady(webSocket, startTimestamp, messageId, message, resolve, reject), 500);
        }
    }

    private _waitForResponseMessage(messageId: string, resolve: ResolveFn, reject: RejectFn) {
        this._openPromises.push({
            timestamp: Date.now(),
            messageId,
            resolve,
            reject,
        });
        this._startTimeoutTimer();
    }

    private _startTimeoutTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._timer = setTimeout(() => this._checkPromiseTimeout(), 1000);
    }

    private _checkPromiseTimeout() {
        this._timer = null;

        this._openPromises.forEach((op, index, arr) => {
            if (op.timestamp < Date.now() - RESPONSE_TIMEOUT_MS) {
                op.reject(`Didn't receive a response within ${RESPONSE_TIMEOUT_MS}ms`);
                arr.splice(index, 1);
            }
        });

        if (this._openPromises.length > 0) {
            this._startTimeoutTimer();
        }
    }

    private _handleData(data: string) {
        if (data === '""' || data === '"keepalive"') {
            // Ignore keep alive messages
            return;
        }

        console.log('Received WebSocket message:', data);

        try {
            const message = JSON.parse(data);
            if (message.type === 'setClientId') {
                global.sessionStorage.setItem(SESSION_STORAGE_WS_CLIENT_ID, message.payload);
                if (this._subscribedTopics.length > 0) {
                    this._subscribeAgainAfterConnectionLost();
                }
            } else if (message.messageId && message.success) {
                const resolvedPromise = this._openPromises.find((op) => op.messageId === message.messageId);
                if (resolvedPromise) {
                    resolvedPromise.resolve();
                    this._openPromises = this._openPromises.filter((op) => op !== resolvedPromise);
                }
            } else if (message.messageId && message.error) {
                const rejectedPromise = this._openPromises.find((op) => op.messageId === message.messageId);
                if (rejectedPromise) {
                    rejectedPromise.reject(message.message);
                    this._openPromises = this._openPromises.filter((op) => op !== rejectedPromise);
                }
            } else if (message.remoteMessage === true) {
                const publishMessage: MashroomMessagingWebSocketPublishMessage = message;
                if (this._messageHandler) {
                    this._messageHandler(publishMessage.message, publishMessage.topic, publishMessage.subscriptionPattern);
                }
            } else {
                console.warn(`Don't know how to handle WebSocket message: `, message);
            }
        } catch (error) {
            console.error('Received WebSocket data is no valid JSON', error);
        }
    }

    private _getWebSocket(): WebSocket | undefined | null {
        if (!this._webSocket) {
            if (!webSocketSupport) {
                throw new Error(`The browser doesn't support WebSockets`);
            }

            this._webSocket = new global.WebSocket(this._connectUrl);
            this._webSocket.onopen = () => {
                console.info('WebSocket connection established');
                this._connected = true;
                this._connectRetries = 0;
            };
            this._webSocket.onerror = (event: Event) => {
                console.error('WebSocket error failed', event);
            };
            this._webSocket.onclose = (event: CloseEvent) => {
                console.error(`Connection closed: Code: ${event.code}, Reason: ${event.reason}`);
                this._webSocket = null;
                this._connected = false;
                this._tryReconnect();
            };
            this._webSocket.onmessage = (event: MessageEvent) => {
                if (typeof (event.data) === 'string') {
                    const data: string = event.data;
                    this._handleData(data);
                } else {
                    console.error('Ignoring non string WebSocket message: ', event.data);
                }
            };
        }

        return this._webSocket;
    }

    private _tryReconnect() {
        if (this._connectRetries < CONNECT_RETRIES && !this._cancelRetry) {
            this._connectRetries++;
            console.warn(`WebSocket connection lost. Try to reconnect (attempt #${this._connectRetries})...`);
            setTimeout(() => this._getWebSocket(), CONNECT_RETRY_TIMEOUT_MS * this._connectRetries);
        } else {
            console.error(`WebSocket connect lost. Giving up after ${this._connectRetries} reconnect attempts.`);
        }
    }

    private _subscribeAgainAfterConnectionLost() {
        this._subscribedTopics.forEach((topic) => {
            this.subscribe(topic);
        });
    }

    private _createId() {
        return nanoid(8);
    }
}
