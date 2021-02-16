
import shortId from 'shortid';

import type {
    MashroomMessagingWebSocketSubscribeRequest,
    MashroomMessagingWebSocketUnsubscribeRequest,
    MashroomMessagingWebSocketPublishRequest,
    MashroomMessagingWebSocketPublishMessage,
} from '@mashroom/mashroom-messaging/type-definitions';
import { SESSION_STORAGE_WS_CLIENT_ID } from '../../../backend/constants';

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

    webSocket: WebSocket | undefined | null;
    connected: boolean;
    messageHandler: ((message: any, topic: string) => void) | null;
    openPromises: Array<OpenPromise>;
    connectRetries: number;
    subscribedTopics: Array<string>;
    timer: ReturnType<typeof setTimeout> | undefined | null;

    constructor(private connectUrl: string) {
        this.webSocket = null;
        this.connected = false;
        this.messageHandler = null;
        this.openPromises = [];
        this.connectRetries = 0;
        this.subscribedTopics = [];
    }

    subscribe(topic: string): Promise<void> {
        const subscribeRequest: MashroomMessagingWebSocketSubscribeRequest = {
            messageId: shortId.generate(),
            command: 'subscribe',
            topic,
        };
        return this.webSocketSend(subscribeRequest).then(
            () => {
                if (this.subscribedTopics.indexOf(topic) === -1) {
                    this.subscribedTopics.push(topic);
                }
            }
        );
    }

    unsubscribe(topic: string): Promise<void> {
        const subscribeRequest: MashroomMessagingWebSocketUnsubscribeRequest = {
            messageId: shortId.generate(),
            command: 'unsubscribe',
            topic,
        };
        return this.webSocketSend(subscribeRequest).then(
            () => {
                this.subscribedTopics = this.subscribedTopics.filter((t) => t !== topic);
            }
        );
    }

    publish(topic: string, message: any): Promise<void> {
        const subscribeRequest: MashroomMessagingWebSocketPublishRequest = {
            messageId: shortId.generate(),
            command: 'publish',
            topic,
            message,
        };
        return this.webSocketSend(subscribeRequest);
    }

    onMessage(handler: (message: any, topic: string) => void) {
        this.messageHandler = handler;
    }

    private webSocketSend(message: any): Promise<void> {
        const messageId = message.messageId;
        if (!messageId) {
            return Promise.reject('Message has no messageId property!');
        }
        const webSocket = this.getWebSocket();
        if (webSocket) {
            return new Promise((resolve, reject) => {
                this.sendWhenReady(webSocket, Date.now(), messageId, JSON.stringify(message), resolve, reject);
            });
        }
        return Promise.reject('No WebSocket connection!');
    }

    private sendWhenReady(webSocket: WebSocket, startTimestamp: number, messageId: string, message: string, resolve: ResolveFn, reject: RejectFn) {
        if (this.connected) {
            console.log('Sending WebSocket message:', message);
            webSocket.send(message);
            this.waitForResponseMessage(messageId, resolve, reject);
        } else if (startTimestamp < Date.now() - WEBSOCKET_READY_TIMEOUT_MS) {
            reject('WebSocket not connected');
        } else {
            console.info('Waiting for WebSocket connection...');
            setTimeout(() => this.sendWhenReady(webSocket, startTimestamp, messageId, message, resolve, reject), 500);
        }
    }

    private waitForResponseMessage(messageId: string, resolve: ResolveFn, reject: RejectFn) {
        this.openPromises.push({
            timestamp: Date.now(),
            messageId,
            resolve,
            reject,
        });
        this.startTimeoutTimer();
    }

    private startTimeoutTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.checkPromiseTimeout(), 1000);
    }

    private checkPromiseTimeout() {
        this.timer = null;

        this.openPromises.forEach((op, index, arr) => {
            if (op.timestamp < Date.now() - RESPONSE_TIMEOUT_MS) {
                op.reject(`Didn't receive a response within ${RESPONSE_TIMEOUT_MS}ms`);
                arr.splice(index, 1);
            }
        });

        if (this.openPromises.length > 0) {
            this.startTimeoutTimer();
        }
    }

    private handleData(data: string) {
        if (data === '""' || data === '"keepalive"') {
            // Ignore keep alive messages
            return;
        }

        console.log('Received WebSocket message:', data);

        try {
            const message = JSON.parse(data);
            if (message.type === 'setClientId') {
                global.sessionStorage.setItem(SESSION_STORAGE_WS_CLIENT_ID, message.payload);
                if (this.subscribedTopics.length > 0) {
                    this.subscribeAgainAfterConnectionLost();
                }
            } else if (message.messageId && message.success) {
                const resolvedPromise = this.openPromises.find((op) => op.messageId === message.messageId);
                if (resolvedPromise) {
                    resolvedPromise.resolve();
                    this.openPromises = this.openPromises.filter((op) => op !== resolvedPromise);
                }
            } else if (message.messageId && message.error) {
                const rejectedPromise = this.openPromises.find((op) => op.messageId === message.messageId);
                if (rejectedPromise) {
                    rejectedPromise.reject(message.message);
                    this.openPromises = this.openPromises.filter((op) => op !== rejectedPromise);
                }
            } else if (message.remoteMessage === true) {
                const publishMessage: MashroomMessagingWebSocketPublishMessage = message;
                if (this.messageHandler) {
                    this.messageHandler(publishMessage.message, publishMessage.topic);
                }
            } else {
                console.warn(`Don't know how to handle WebSocket message: `, message);
            }
        } catch (error) {
            console.error('Received WebSocket data is no valid JSON', error);
        }
    }

    private getWebSocket(): WebSocket | undefined | null {
        if (!this.webSocket) {
            if (!webSocketSupport) {
                throw new Error(`The browser doesn't support WebSockets`);
            }

            this.webSocket = new global.WebSocket(this.connectUrl);
            this.webSocket.onopen = () => {
                console.info('WebSocket connection established');
                this.connected = true;
                this.connectRetries = 0;
            };
            this.webSocket.onerror = (event: Event) => {
                console.error('WebSocket error failed', event);
            };
            this.webSocket.onclose = (event: CloseEvent) => {
                console.error(`Connection closed: Code: ${event.code}, Reason: ${event.reason}`);
                this.webSocket = null;
                this.connected = false;
                this.tryReconnect();
            };
            this.webSocket.onmessage = (event: MessageEvent) => {
                if (typeof (event.data) === 'string') {
                    const data: string = event.data;
                    this.handleData(data);
                } else {
                    console.error('Ignoring non string WebSocket message: ', event.data);
                }
            };
        }

        return this.webSocket;
    }

    private tryReconnect() {
        if (this.connectRetries < CONNECT_RETRIES) {
            this.connectRetries++;
            console.warn(`WebSocket connection lost. Try to reconnect (attempt #${this.connectRetries})...`);
            setTimeout(() => this.getWebSocket(), CONNECT_RETRY_TIMEOUT_MS * this.connectRetries);
        } else {
            console.error(`WebSocket connect lost. Giving up after ${this.connectRetries} reconnect attempts.`);
        }
    }

    private subscribeAgainAfterConnectionLost() {
        this.subscribedTopics.forEach((topic) => {
            this.subscribe(topic);
        });
    }
}
