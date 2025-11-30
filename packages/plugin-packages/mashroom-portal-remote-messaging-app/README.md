
# Mashroom Portal Remote Messaging App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This Microfrontend can be used to test remote messaging in the [Mashroom Portal](../mashroom-portal).
This App requires the [mashroom-messaging](../mashroom-messaging) and [mashroom-websocket](../mashroom-websocket) plugins to be installed.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-portal-demo-remote-messaging** as *dependency*.

After adding the App to a page, you can send a message to another user (or another browser tab)
by using the (remote) topic _user/&lt;other-username&gt;/<something>_.
And the app will automatically subscribe the topic _user/<your_username>/#_ to receive all user messages.
