
# Mashroom Portal Remote Messaging App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This _Mashroom Portal_ App can be used to test remote messaging in the _Mashroom Portal_.
This App requires the _mashroom-messaging_ and _mashroom-websocket_ plugins to be installed.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-demo-remote-messaging** as *dependency*.

After adding the app to a page you can send a message to another user (or another browser tab)
by using the (remote) topic _user/&lt;other-username&gt;/<something>_.
And the app will automatically subscribe the topic _user/<your_username>/#_ to receive all user messages.


