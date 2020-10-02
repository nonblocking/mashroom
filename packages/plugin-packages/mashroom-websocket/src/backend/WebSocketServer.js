// @flow

import {Server} from 'ws';
import {v4} from 'uuid';
import context from './context';

import type {WebSocket} from 'ws';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomWebSocketClient,
    MashroomWebSocketMatcher,
    MashroomWebSocketMessageListener,
    MashroomWebSocketDisconnectListener,
} from '../../type-definitions';
import type {
    MashroomWebSocketServer,
} from '../../type-definitions/internal';
import type { MashroomStorageService } from '../../../mashroom-storage/type-definitions';

const CHECK_CONNECTIONS_INTERVAL_MS = 30 * 1000;
const RECONNECT_INTERVAL_MS = 10 * 1000;
const KEEP_ALIVE_MESSAGE = 'keepalive';

export default class WebSocketServer implements MashroomWebSocketServer {

    _logger: MashroomLogger;
    _server: Server;
    _clients: Array<{
        client: MashroomWebSocketClient,
        webSocket: WebSocket,
    }>;
    _messageListener: Array<{
        matcher: MashroomWebSocketMatcher,
        listener: MashroomWebSocketMessageListener
    }>;
    _disconnectListeners: Array<MashroomWebSocketDisconnectListener>;
    _checkConnectionInterval: IntervalID;
    _keepAliveInterval: IntervalID;

    constructor(loggerFactory: MashroomLoggerFactory, storageService: MashroomStorageService) {
        this._logger = loggerFactory('mashroom.websocket.server');
        this._bufferedMessagesCollection = storageService.getCollection<{ clientId: string, message: any}>('buffered-messages-collection');
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

    addMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener) {
        this._messageListener.push({
            matcher,
            listener
        });
    }

    removeMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener) {
        this._messageListener = this._messageListener.filter((wrapper) => wrapper.matcher !== matcher || wrapper.listener !== listener);
    }

    addDisconnectListener(listener: MashroomWebSocketDisconnectListener) {
        this._disconnectListeners.push(listener);
    }

    removeDisconnectListener(listener: MashroomWebSocketDisconnectListener) {
        this._disconnectListeners = this._disconnectListeners.filter((l) => l !== listener);
    }

    getClientIdFromConnectPath(connectPath: string): ?string {
        const CLIENT_ID_QUERY_PARAM = 'clientId'
        if (connectPath.indexOf(`${CLIENT_ID_QUERY_PARAM}=`) > -1) {
            const params = connectPath.split('&');
            const idParam = params.find(p => p.indexOf(`${CLIENT_ID_QUERY_PARAM}=`) > -1);
            const [, clientId] = (idParam || '').split(/=/);
            return clientId;
        }

        return;
    }

    addWebSocketListeners(webSocket: WebSocket, contextLogger: MashroomLogger, client: MashroomWebSocketClient) {
        webSocket.on('error', (error) => {
            contextLogger.error('WebSocket error', error);
        });
        webSocket.on('close', () => {
            contextLogger.info(`Client ${client.clientId} disconnected, waiting for reconnect`);
            client.reconnecting = setTimeout(() => {
                if (client.reconnecting) {
                    contextLogger.debug(`No reconnect within 10 seconds, removing client ${client.clientId}`);
                    this._removeClient(client);
                }
            }, RECONNECT_INTERVAL_MS);
        });
        webSocket.on('pong', () => {
            client.alive = true;
        });
        webSocket.on('message', (textMsg) => {
            this._handleMessage(textMsg, client);
        });
    }

    async createClient(webSocket: WebSocket, connectPath: string, user: MashroomSecurityUser, loggerContext: {}) {
        const contextLogger = this._logger.withContext(loggerContext);

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
            clearTimeout(reconnectingClient.client.reconnecting);
            delete reconnectingClient.client.reconnecting;
            reconnectingClient.webSocket = webSocket;
            this.addWebSocketListeners(reconnectingClient.webSocket, contextLogger, reconnectingClient.client);
            const bufferedMessages = await (await this._bufferedMessagesCollection).find((msg) => msg.clientId === reconnectingClient.client.clientId);
            if (bufferedMessages && bufferedMessages.length > 0) {
                bufferedMessages.forEach((item) => {
                    this.sendMessage(reconnectingClient.client, item.message);
                });
                await (await this._bufferedMessagesCollection).deleteMany((msg) => msg.clientId === reconnectingClient.client.clientId);
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

    getServer() {
        return this._server;
    }

    async sendMessage(client: MashroomWebSocketClient, message: any) {
        const webSocket = this._getWebSocket(client);
        if (webSocket && !client.reconnecting) {
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

        if (client.reconnecting) {
            client.bufferedMessages = client.bufferedMessages || [];
            await (await this._bufferedMessagesCollection).insertOne({
                clientId: client.clientId,
                message,
            })
        }
    }

    close(client: MashroomWebSocketClient) {
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

    getClientCount() {
        return this._clients.length;
    }

    closeAll() {
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

    _handleMessage(textMsg: string, client: MashroomWebSocketClient) {
        const contextLogger = this._logger.withContext(client.loggerContext);

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

    async _removeClient(client: MashroomWebSocketClient) {
        await (await this._bufferedMessagesCollection).deleteMany((msg) => msg.clientId === client.clientId)
        this._clients = this._clients.filter((cw) => cw.client !== client);
        this._informDisconnectListeners(client);
    }

    _informDisconnectListeners(client: MashroomWebSocketClient) {
        this._disconnectListeners.forEach((listener) => {
            try {
                listener(client);
            } catch (e) {
                this._logger.error('Disconnect listener threw error', e);
            }
        });
    }

    _getWebSocket(client: MashroomWebSocketClient): ?WebSocket {
        const clientWrapper = this._clients.find((cw) => cw.client === client);
        return clientWrapper ? clientWrapper.webSocket : null;
    }

    _sendKeepAlive() {
        this._clients.forEach((wrapper) => {
            this.sendMessage(wrapper.client, KEEP_ALIVE_MESSAGE).then(
                () => {}, () => {}
            );
        });
    }

    _checkConnections() {
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
