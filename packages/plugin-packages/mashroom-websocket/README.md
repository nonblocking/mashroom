
# Mashroom WebSocket

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds WebSocket support to the _Mashroom Server_.
It exposes a new Service that can be used to interact with clients that connect at _/websocket/*_.

It allows only authenticated users to connect.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-websocket** as *dependency*.

And you can use the security service like this:

```js
// @flow

import type {MashroomWebSocketService} from '@mashroom/mashroom-websocket/type-definitions';

export default async (req: ExpressRequest, res: ExpressResponse) => {
    const webSocketService: MashroomWebSocketService = req.pluginContext.services.websocket.service;

    webSocketService.addMessageListener((path) => path === '/whatever', async (message, client) => {

        // ...

        await webSocketService.sendMessage(client, {
            message: 'Hello there'
        });
    });
}
```

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom WebSocket Webapp": {
            "path": "/websocket",
            "tmpFileStorePath": "/tmp",
            "restrictToRoles": ["WebSocketRole"],
            "enableKeepAlive": true,
            "keepAliveIntervalSec": 15,
            "maxConnections": 2000
        }
    }
}
```

 * _path_: The path where the clients can connect
 * _tmpFileStorePath_: The path where messages are temporary stored during client reconnect
 * _restrictToRoles_: An optional array of roles that are required to connect (default: null)
 * _enableKeepAlive_: Enable a periodic keep alive message where the server will send "keepalive" to all clients.
   This is useful if you want to prevent reverse proxies to close connections because of a read timeout (Default: true)
 * _keepAliveIntervalSec_: Interval for keepalive messages in seconds (default: 15)
 * _maxConnections_: Max allowed WebSocket connections per node (default: 2000)

There will also be a **test page** available under: _/websocket/test_

## Services

### MashroomWebSocketService

The exposed service is accessible through _pluginContext.services.websocket.service_

**Interface:**

```js
export interface MashroomWebSocketService {
    /**
     * Add a listener for message.
     * The matcher defines which messages the listener receives. The match can be based on the connect path
     * (which is the sub path where the client connected, e.g. if it connected on /websocket/test the connect path would be /test)
     * or be based on the message content or both.
     */
    addMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void;
    /**
     * Remove a message listener
     */
    removeMessageListener(matcher: MashroomWebSocketMatcher, listener: MashroomWebSocketMessageListener): void;
    /**
     * Add a listener for disconnects
     */
    addDisconnectListener(listener: MashroomWebSocketDisconnectListener): void;
    /**
     * Remove a disconnect listener
     */
    removeDisconnectListener(listener: MashroomWebSocketDisconnectListener): void;
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
    +basePath: string;
}
```
