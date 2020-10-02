/* eslint-disable */

import type {MashroomSecurityUser} from "@mashroom/mashroom-security/type-definitions";

export type MashroomWebSocketMatcher = (
    connectPath: string,
    message: any,
) => boolean;

export type MashroomWebSocketMessageListener = (
    message: any,
    client: MashroomWebSocketClient,
) => void;
export type MashroomWebSocketDisconnectListener = (
    client: MashroomWebSocketClient,
) => void;

export type MashroomWebSocketClient = {
    readonly connectPath: string;
    readonly user: MashroomSecurityUser;
    readonly loggerContext: {};
    readonly clientId: string;
    alive: boolean;
    reconnecting?: TimeoutID;
};

/**
 * A service to simplify WebSocket handling on the server side.
 * Handles all connects on ${basePath}/*
 */
export interface MashroomWebSocketService {
    /**
     * Add a listener for message.
     * The matcher defines which messages the listener receives. The match can be based on the connect path
     * (which is the sub path where the client connected, e.g. if it connected on /websocket/test the connect path would be /test)
     * or be based on the message content or both.
     */
    addMessageListener(
        matcher: MashroomWebSocketMatcher,
        listener: MashroomWebSocketMessageListener,
    ): void;

    /**
     * Remove a message listener
     */
    removeMessageListener(
        matcher: MashroomWebSocketMatcher,
        listener: MashroomWebSocketMessageListener,
    ): void;

    /**
     * Add a listener for disconnects
     */
    addDisconnectListener(listener: MashroomWebSocketDisconnectListener): void;

    /**
     * Remove a disconnect listener
     */
    removeDisconnectListener(
        listener: MashroomWebSocketDisconnectListener,
    ): void;

    /**
     * Send a (JSON) message to given client.
     */
    sendMessage(client: MashroomWebSocketClient, message: any): Promise<void>;

    /**
     * Get all clients on given connect path
     */
    getClientsOnPath(connectPath: string): Array<MashroomWebSocketClient>;

    /**
     * Get all clients for a specific username
     */
    getClientsOfUser(username: string): Array<MashroomWebSocketClient>;

    /**
     * Get the number of connected clients
     */
    getClientCount(): number;

    /**
     * Close client connection (this will also trigger disconnect listeners)
     */
    close(client: MashroomWebSocketClient): void;

    /**
     * The base path where clients can connect
     */
    readonly basePath: string;
}
