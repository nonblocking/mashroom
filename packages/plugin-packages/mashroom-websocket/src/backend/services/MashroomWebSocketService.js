// @flow

import context from '../context';

import type {
    MashroomWebSocketClient,
    MashroomWebSocketDisconnectListener,
    MashroomWebSocketMatcher, MashroomWebSocketMessageListener,
    MashroomWebSocketService as MashroomWebSocketServiceType
} from '../../../type-definitions';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';

export default class MashroomWebSocketService implements MashroomWebSocketServiceType {

    _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.websocket.service');
    }

    addMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener) {
        context.server.addMessageListener(matcher, listener);
    }

    removeMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener) {
        context.server.removeMessageListener(matcher, listener);
    }

    addDisconnectListener(listener: MashroomWebSocketDisconnectListener) {
        context.server.addDisconnectListener(listener);
    }

    removeDisconnectListener(listener: MashroomWebSocketDisconnectListener) {
        context.server.removeDisconnectListener(listener);
    }

    async sendMessage(client: MashroomWebSocketClient, message: {}) {
        await context.server.sendMessage(client, message);
    }

    getClientsOnPath(connectPath: string) {
        return context.server.getClientsOnPath(connectPath);
    }

    getClientsOfUser(username: string) {
        return context.server.getClientsOfUser(username);
    }

    getClientCount() {
        return context.server.getClientCount();
    }

    close(client: MashroomWebSocketClient) {
        context.server.close(client);
    }

    get basePath(): string {
        return context.basePath;
    }

}

