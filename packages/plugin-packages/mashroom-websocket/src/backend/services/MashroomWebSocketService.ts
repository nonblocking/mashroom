
import context from '../context';

import type {
    MashroomWebSocketClient,
    MashroomWebSocketDisconnectListener,
    MashroomWebSocketMatcher, MashroomWebSocketMessageListener,
    MashroomWebSocketService as MashroomWebSocketServiceType
} from '../../../type-definitions';

export default class MashroomWebSocketService implements MashroomWebSocketServiceType {

    addMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void {
        context.server.addMessageListener(matcher, listener);
    }

    removeMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void {
        context.server.removeMessageListener(matcher, listener);
    }

    addDisconnectListener(listener: MashroomWebSocketDisconnectListener): void {
        context.server.addDisconnectListener(listener);
    }

    removeDisconnectListener(listener: MashroomWebSocketDisconnectListener): void {
        context.server.removeDisconnectListener(listener);
    }

    async sendMessage(client: MashroomWebSocketClient, message: any): Promise<void> {
        await context.server.sendMessage(client, message);
    }

    getClientsOnPath(connectPath: string): Array<MashroomWebSocketClient> {
        return context.server.getClientsOnPath(connectPath);
    }

    getClientsOfUser(username: string): Array<MashroomWebSocketClient> {
        return context.server.getClientsOfUser(username);
    }

    getClientCount(): number {
        return context.server.getClientCount();
    }

    close(client: MashroomWebSocketClient): void {
        context.server.close(client);
    }

    get basePath(): string {
        return context.basePath;
    }

}

