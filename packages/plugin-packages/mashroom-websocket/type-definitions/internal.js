// @flow

import type {Server, WebSocket} from 'ws';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomWebSocketMatcher,
    MashroomWebSocketMessageListener,
    MashroomWebSocketDisconnectListener,
    MashroomWebSocketClient,
} from './api';

export interface MashroomWebSocketServer {
    addMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void;
    removeMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void;
    addDisconnectListener(listener: MashroomWebSocketDisconnectListener): void;
    removeDisconnectListener(listener: MashroomWebSocketDisconnectListener): void;
    createClient(webSocket: WebSocket, connectPath: string, user: MashroomSecurityUser, loggerContext: {}): void;
    getServer(): Server;
    sendMessage(client: MashroomWebSocketClient, message: any): Promise<void>;
    close(client: MashroomWebSocketClient): void;
    closeAll(): void;
    getClientsOnPath(connectPath: string): Array<MashroomWebSocketClient>;
    getClientsOfUser(username: string): Array<MashroomWebSocketClient>;
    getClientCount(): number;
}
