
# Mashroom Portal Demo WebSocket Proxy App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This is a simple Microfrontend that demonstrates how the [Mashroom Portal](../mashroom-portal) proxy can be used to connect to a
WebSocket server that cannot be reached directly by the client.

By default, it connects to an echo server on ws://ws.ifelse.io/, but that server might go down any time.
If you can't connect, you can always launch a local WebSocket server (like [https://github.com/pmuellr/ws-echo](https://github.com/pmuellr/ws-echo))
and change the *targetUri* in *package.json* accordingly.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **mashroom-portal-demo-rest-proxy-app** as *dependency*.

Then you can place *Mashroom Portal Demo WebSocket Proxy App* on any page via *Portal Admin Toolbar*.
