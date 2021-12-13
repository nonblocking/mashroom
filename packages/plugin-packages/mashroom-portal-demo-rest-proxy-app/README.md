
# Mashroom Portal Demo Rest Proxy App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This is a simple SPA that demonstrates how the _Mashroom Portal_ proxy could be used to connect to a
REST API that cannot be reached directly by the client.

It fetches data from the SpaceX API, but connects through the Portal. So the actual endpoint will not be visible
in the browser.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-demo-rest-proxy-app** as *dependency*.

Then you can place it on any page via Portal Admin Toolbar.
