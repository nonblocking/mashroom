
import {Server} from 'ws';
import {v4} from 'uuid';
import context from './context';

import type WebSocket from 'ws';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomWebSocketClient,
    MashroomWebSocketMatcher,
    MashroomWebSocketMessageListener,
    MashroomWebSocketDisconnectListener,
} from '../../type-definitions';
import type {
    InternalMashroomWebSocketClient,
    IntervalID,
    MashroomWebSocketServer,
} from '../../type-definitions/internal';
import ReconnectMessageBufferStore from './webapp/ReconnectMessageBufferStore';

const CHECK_CONNECTIONS_INTERVAL_MS = 30 * 1000;
const KEEP_ALIVE_MESSAGE = 'keepalive';

export default class WebSocketServer implements MashroomWebSocketServer {

    private logger: MashroomLogger;
    private server: Server;
    _clients: Array<{
        client: InternalMashroomWebSocketClient,
        webSocket: WebSocket,
    }>;
    private messageListener: Array<{
        matcher: MashroomWebSocketMatcher,
        listener: MashroomWebSocketMessageListener
    }>;
    private disconnectListeners: Array<MashroomWebSocketDisconnectListener>;
    private checkConnectionInterval: IntervalID;
    private keepAliveInterval: IntervalID | undefined;

    constructor(loggerFactory: MashroomLoggerFactory, private reconnectMessageBufferStore: ReconnectMessageBufferStore) {
        this.logger = loggerFactory('mashroom.websocket.server');
        this.server = new Server({
            noServer: true
        });
        this._clients = [];
        this.messageListener = [];
        this.disconnectListeners = [];

        this.checkConnectionInterval = setInterval(() => this.checkConnections(), CHECK_CONNECTIONS_INTERVAL_MS);
        if (context.enableKeepAlive) {
            this.keepAliveInterval = setInterval(() => this.sendKeepAlive(), context.keepAliveIntervalSec * 1000);
        }
    }

    addMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void {
        this.messageListener.push({
            matcher,
            listener
        });
    }

    removeMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void {
        this.messageListener = this.messageListener.filter((wrapper) => wrapper.matcher !== matcher || wrapper.listener !== listener);
    }

    addDisconnectListener(listener: MashroomWebSocketDisconnectListener): void {
        this.disconnectListeners.push(listener);
    }

    removeDisconnectListener(listener: MashroomWebSocketDisconnectListener): void {
        this.disconnectListeners = this.disconnectListeners.filter((l) => l !== listener);
    }

    async createClient(webSocket: WebSocket, connectPath: string, user: MashroomSecurityUser, loggerContext: any): Promise<void> {
        const contextLogger = this.logger.withContext(loggerContext);

        contextLogger.debug(`WebSocket connection opened on path: ${connectPath}. User: ${user.username}`);

        if (this.getClientCount() > context.maxConnections) {
            contextLogger.warn(`Max WebSocket connections (${context.maxConnections}) reached. Closing new connection.`);
            webSocket.close();
            return;
        }

        const alive = true;
        const reconnecting = undefined;
        const clientIdFromConnectPath = this.getClientIdFromConnectPath(connectPath);
        const reconnectingClient = this._clients.find((c) => c.client.clientId === clientIdFromConnectPath);
        const clientId = reconnectingClient ? (clientIdFromConnectPath || v4()) : v4();

        if (reconnectingClient) {
            contextLogger.debug(`Client ${clientId} reconnected`);
            if (reconnectingClient.client.reconnecting) {
                clearTimeout(reconnectingClient.client.reconnecting);
            }
            delete reconnectingClient.client.reconnecting;
            reconnectingClient.webSocket = webSocket;
            this.addWebSocketListeners(reconnectingClient.webSocket, contextLogger, reconnectingClient.client);
            const bufferedMessages = await this.reconnectMessageBufferStore.getData(this.getFileName(user, reconnectingClient.client));
            if (bufferedMessages && bufferedMessages.length > 0) {
                bufferedMessages.forEach((item) => {
                    this.sendMessage(reconnectingClient.client, JSON.parse(item));
                });
                await this.reconnectMessageBufferStore.removeFile(this.getFileName(user, reconnectingClient.client));
            }
            return;
        }

        const client = {
            connectPath,
            user,
            loggerContext,
            alive,
            reconnecting,
            clientId,
        };
        this._clients.push({
            client,
            webSocket,
        });

        webSocket.send(JSON.stringify({type: 'setClientId', payload: clientId}));

        this.addWebSocketListeners(webSocket, contextLogger, client);
    }

    getServer(): Server {
        return this.server;
    }

    async sendMessage(client: MashroomWebSocketClient, message: any): Promise<void> {
        const webSocket = this.getWebSocket(client);
        const internalClient = client as InternalMashroomWebSocketClient;
        if (webSocket && !internalClient.reconnecting) {
            const contextLogger = this.logger.withContext(client.loggerContext);

            return new Promise((resolve, reject) => {
                contextLogger.debug(`Sending WebSocket message to client:`, message);
                webSocket.send(JSON.stringify(message), (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        if (internalClient.reconnecting) {
            await this.reconnectMessageBufferStore.appendData(this.getFileName(client.user, client), JSON.stringify(message));
        }
    }

    close(client: MashroomWebSocketClient): void {
        const webSocket = this.getWebSocket(client);
        if (webSocket) {
            try {
                webSocket.close();
            } catch (err) {
                this.logger.warn('Closing WebSocket client failed', err);
            }
            this.removeClient(client);
        }
    }

    getClientsOnPath(connectPath: string): Array<MashroomWebSocketClient> {
        return this._clients.filter((wrapper) => wrapper.client.connectPath === connectPath).map((wrapper) => wrapper.client);
    }

    getClientsOfUser(username: string): Array<MashroomWebSocketClient> {
        return this._clients.filter((wrapper) => wrapper.client.user.username === username).map((wrapper) => wrapper.client);
    }

    get clients(): Readonly<Array<MashroomWebSocketClient>> {
        return Object.freeze(this._clients.map((c) => c.client));
    }

    getClientCount(): number {
        return this._clients.length;
    }

    closeAll(): void {
        if (this.checkConnectionInterval) {
            clearInterval(this.checkConnectionInterval);
        }
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        this.logger.info('Closing all WebSocket connections');
        this._clients.forEach((cw) => {
            this.close(cw.client);
        });
    }

    private getClientIdFromConnectPath(connectPath: string): string | null {
        const CLIENT_ID_QUERY_PARAM = 'clientId'
        if (connectPath.indexOf(`${CLIENT_ID_QUERY_PARAM}=`) > -1) {
            const params = connectPath.split('&');
            const idParam = params.find(p => p.indexOf(`${CLIENT_ID_QUERY_PARAM}=`) > -1);
            const [, clientId] = (idParam || '').split(/=/);
            return clientId;
        }

        return null;
    }

    private addWebSocketListeners(webSocket: WebSocket, contextLogger: MashroomLogger, client: MashroomWebSocketClient) {
        webSocket.on('error', (error) => {
            contextLogger.error('WebSocket error', error);
        });
        webSocket.on('close', () => {
            if (this.reconnectMessageBufferStore.enabled) {
                contextLogger.info(`Client ${client.clientId} disconnected, waiting for reconnect`);
                const internalClient = client as InternalMashroomWebSocketClient;
                internalClient.reconnecting = setTimeout(() => {
                    if (internalClient.reconnecting) {
                        contextLogger.debug(`No reconnect within 10 seconds, removing client ${client.clientId}`);
                        this.removeClient(client);
                    }
                }, context.reconnectTimeoutSec * 1000);
            } else {
                this.removeClient(client);
            }
        });
        webSocket.on('pong', () => {
            client.alive = true;
        });
        webSocket.on('message', (textMsg) => {
            this.handleMessage(textMsg, client);
        });
    }

    private getFileName({username}: MashroomSecurityUser, {clientId}: MashroomWebSocketClient): string {
        return `${username}_${clientId}`;
    }

    private handleMessage(textMsg: any, client: MashroomWebSocketClient): void {
        const contextLogger = this.logger.withContext(client.loggerContext);

        if (typeof (textMsg) !== 'string') {
            contextLogger.warn('Ignoring WebSocket message because currently binary is not supported');
            return;
        }

        let message = {};
        try {
            message = JSON.parse(textMsg);
        } catch (e) {
            contextLogger.warn('Ignoring WebSocket message because it is no valid JSON', e);
            return;
        }

        contextLogger.debug('Received WebSocket message from client:', message);

        let handled = false;
        this.messageListener.forEach((wrapper) => {
            let match = false;
            try {
                match = wrapper.matcher(client.connectPath, message);
            } catch (e) {
                contextLogger.warn('Matcher execution failed', e);
            }
            if (match) {
                try {
                    wrapper.listener(message, client);
                } catch (e) {
                    contextLogger.error('Message listener threw error', e);
                }
                handled = true;
            }
        });

        if (!handled) {
            contextLogger.warn(`No message listener found to handle message from client connected to: ${client.connectPath}. Message: `, message);
        }
    }

    private async removeClient(client: MashroomWebSocketClient): Promise<void> {
        const internalClient = client as InternalMashroomWebSocketClient;
        if (internalClient.reconnecting) {
            await this.reconnectMessageBufferStore.removeFile(this.getFileName(client.user, client));
        }
        this._clients = this._clients.filter((cw) => cw.client !== client);
        this.informDisconnectListeners(client);
    }

    private informDisconnectListeners(client: MashroomWebSocketClient): void {
        this.disconnectListeners.forEach((listener) => {
            try {
                listener(client);
            } catch (e) {
                this.logger.error('Disconnect listener threw error', e);
            }
        });
    }

    private getWebSocket(client: MashroomWebSocketClient): WebSocket | null {
        const clientWrapper = this._clients.find((cw) => cw.client === client);
        return clientWrapper ? clientWrapper.webSocket : null;
    }

    private sendKeepAlive(): void {
        this._clients.forEach((wrapper) => {
            this.sendMessage(wrapper.client, KEEP_ALIVE_MESSAGE).then(
                () => { /* nothing to do */ }, () => { /* nothing to do */ }
            );
        });
    }

    private checkConnections(): void {
        const clientCount = this.getClientCount();
        if (clientCount > 0) {
            this._clients.forEach((wrapper) => {
                if (!wrapper.client.alive) {
                    this.close(wrapper.client);
                } else {
                    wrapper.client.alive = false;
                    wrapper.webSocket.ping();
                }
            });
        }
    }

}
