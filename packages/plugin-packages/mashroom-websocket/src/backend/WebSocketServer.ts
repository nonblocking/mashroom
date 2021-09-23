
import {Server, CLOSING, OPEN} from 'ws';
import {v4} from 'uuid';
import context from './context';
import ReconnectMessageBufferStore from './webapp/ReconnectMessageBufferStore';

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

const CHECK_CONNECTIONS_INTERVAL_MS = 30 * 1000;
const KEEP_ALIVE_MESSAGE = 'keepalive';

export default class WebSocketServer implements MashroomWebSocketServer {

    private _logger: MashroomLogger;
    private _server: Server;
    private _clients: Array<{
        client: InternalMashroomWebSocketClient,
        webSocket: WebSocket,
    }>;
    private _messageListener: Array<{
        matcher: MashroomWebSocketMatcher,
        listener: MashroomWebSocketMessageListener
    }>;
    private _disconnectListeners: Array<MashroomWebSocketDisconnectListener>;
    private _checkConnectionInterval: IntervalID;
    private _keepAliveInterval: IntervalID | undefined;

    constructor(loggerFactory: MashroomLoggerFactory, private _reconnectMessageBufferStore: ReconnectMessageBufferStore) {
        this._logger = loggerFactory('mashroom.websocket.server');
        this._server = new Server({
            noServer: true
        });
        this._clients = [];
        this._messageListener = [];
        this._disconnectListeners = [];

        this._checkConnectionInterval = setInterval(() => this._checkConnections(), CHECK_CONNECTIONS_INTERVAL_MS);
        if (context.enableKeepAlive) {
            this._keepAliveInterval = setInterval(() => this._sendKeepAlive(), context.keepAliveIntervalSec * 1000);
        }
    }

    addMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void {
        this._messageListener.push({
            matcher,
            listener
        });
    }

    removeMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void {
        this._messageListener = this._messageListener.filter((wrapper) => wrapper.matcher !== matcher || wrapper.listener !== listener);
    }

    addDisconnectListener(listener: MashroomWebSocketDisconnectListener): void {
        this._disconnectListeners.push(listener);
    }

    removeDisconnectListener(listener: MashroomWebSocketDisconnectListener): void {
        this._disconnectListeners = this._disconnectListeners.filter((l) => l !== listener);
    }

    async createClient(webSocket: WebSocket, connectPath: string, user: MashroomSecurityUser, loggerContext: any): Promise<void> {
        const contextLogger = this._logger.withContext(loggerContext);

        contextLogger.debug(`WebSocket connection opened on path: ${connectPath}. User: ${user.username}`);

        if (this.getClientCount() > context.maxConnections) {
            contextLogger.warn(`Max WebSocket connections (${context.maxConnections}) reached. Closing new connection.`);
            webSocket.close();
            return;
        }

        const alive = true;
        const reconnecting = undefined;
        const clientIdFromConnectPath = this._getClientIdFromConnectPath(connectPath);
        const reconnectingClient = this._clients.find((c) => c.client.clientId === clientIdFromConnectPath);
        const clientId = reconnectingClient ? (clientIdFromConnectPath || v4()) : v4();

        if (reconnectingClient) {
            contextLogger.debug(`Client ${clientId} reconnected`);
            if (reconnectingClient.client.reconnecting) {
                clearTimeout(reconnectingClient.client.reconnecting);
            }
            delete reconnectingClient.client.reconnecting;
            reconnectingClient.webSocket = webSocket;
            this._addWebSocketListeners(reconnectingClient.webSocket, contextLogger, reconnectingClient.client);
            const bufferedMessages = await this._reconnectMessageBufferStore.getData(this._getFileName(user, reconnectingClient.client));
            if (bufferedMessages && bufferedMessages.length > 0) {
                bufferedMessages.forEach((item) => {
                    this.sendMessage(reconnectingClient.client, JSON.parse(item));
                });
                await this._reconnectMessageBufferStore.removeFile(this._getFileName(user, reconnectingClient.client));
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

        this._addWebSocketListeners(webSocket, contextLogger, client);
    }

    getServer(): Server {
        return this._server;
    }

    async sendMessage(client: MashroomWebSocketClient, message: any): Promise<void> {
        const webSocket = this._getWebSocket(client);
        const internalClient = client as InternalMashroomWebSocketClient;
        if (webSocket && webSocket.readyState === OPEN && !internalClient.reconnecting) {
            const contextLogger = this._logger.withContext(client.loggerContext);

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

        if (internalClient.reconnecting || (webSocket && webSocket.readyState === CLOSING)) {
            await this._reconnectMessageBufferStore.appendData(this._getFileName(client.user, client), JSON.stringify(message));
        }
    }

    close(client: MashroomWebSocketClient): void {
        const webSocket = this._getWebSocket(client);
        if (webSocket) {
            try {
                webSocket.close();
            } catch (err) {
                this._logger.warn('Closing WebSocket client failed', err);
            }
            this._removeClient(client);
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
        if (this._checkConnectionInterval) {
            clearInterval(this._checkConnectionInterval);
        }
        if (this._keepAliveInterval) {
            clearInterval(this._keepAliveInterval);
        }
        this._logger.info('Closing all WebSocket connections');
        this._clients.forEach((cw) => {
            this.close(cw.client);
        });
    }

    private _getClientIdFromConnectPath(connectPath: string): string | null {
        const CLIENT_ID_QUERY_PARAM = 'clientId'
        if (connectPath.indexOf(`${CLIENT_ID_QUERY_PARAM}=`) > -1) {
            const params = connectPath.split('&');
            const idParam = params.find(p => p.indexOf(`${CLIENT_ID_QUERY_PARAM}=`) > -1);
            const [, clientId] = (idParam || '').split(/=/);
            return clientId;
        }

        return null;
    }

    private _addWebSocketListeners(webSocket: WebSocket, contextLogger: MashroomLogger, client: MashroomWebSocketClient) {
        webSocket.on('error', (error) => {
            contextLogger.error('WebSocket error', error);
        });
        webSocket.on('close', () => {
            if (this._reconnectMessageBufferStore.enabled) {
                contextLogger.info(`Client ${client.clientId} disconnected, waiting for reconnect`);
                const internalClient = client as InternalMashroomWebSocketClient;
                internalClient.reconnecting = setTimeout(() => {
                    if (internalClient.reconnecting) {
                        contextLogger.debug(`No reconnect within 10 seconds, removing client ${client.clientId}`);
                        this._removeClient(client);
                    }
                }, context.reconnectTimeoutSec * 1000);
            } else {
                this._removeClient(client);
            }
        });
        webSocket.on('pong', () => {
            client.alive = true;
        });
        webSocket.on('message', (textMsg) => {
            this._handleMessage(textMsg, client);
        });
    }

    private _getFileName({username}: MashroomSecurityUser, {clientId}: MashroomWebSocketClient): string {
        return `${username}_${clientId}`;
    }

    private _handleMessage(msg: WebSocket.Data, client: MashroomWebSocketClient): void {
        const contextLogger = this._logger.withContext(client.loggerContext);

        let textMsg: string;
        if (typeof (msg) === 'string') {
            textMsg = msg;
        } else if (msg instanceof Buffer) {
            textMsg = msg.toString();
        } else {
            contextLogger.warn('Ignoring WebSocket message because format is not supported:', msg);
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
        this._messageListener.forEach((wrapper) => {
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

    private async _removeClient(client: MashroomWebSocketClient): Promise<void> {
        const internalClient = client as InternalMashroomWebSocketClient;
        if (internalClient.reconnecting) {
            await this._reconnectMessageBufferStore.removeFile(this._getFileName(client.user, client));
        }
        this._clients = this._clients.filter((cw) => cw.client !== client);
        this._informDisconnectListeners(client);
    }

    private _informDisconnectListeners(client: MashroomWebSocketClient): void {
        this._disconnectListeners.forEach((listener) => {
            try {
                listener(client);
            } catch (e) {
                this._logger.error('Disconnect listener threw error', e);
            }
        });
    }

    private _getWebSocket(client: MashroomWebSocketClient): WebSocket | null {
        const clientWrapper = this._clients.find((cw) => cw.client === client);
        return clientWrapper ? clientWrapper.webSocket : null;
    }

    private _sendKeepAlive(): void {
        this._clients.forEach((wrapper) => {
            this.sendMessage(wrapper.client, KEEP_ALIVE_MESSAGE).then(
                () => { /* nothing to do */ }, () => { /* nothing to do */ }
            );
        });
    }

    private _checkConnections(): void {
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
