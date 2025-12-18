
# Mashroom Portal Demo Pure JS App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin package contains two small React Microfrontend that share external vendor libraries and can act
as a building block in the [Mashroom Portal](../mashroom-portal).

It uses Webpack to bundle the Apps to SystemJS modules and requests the external *React* dependencies via *Import Map*.

This approach leads to tiny Apps with about 1.5KB each.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-portal-demo-import-map** as *dependency*.

Then you can place *Mashroom Portal Demo Import Map 1* and *Mashroom Portal Demo Import Map 2* on any page via *Portal Admin Toolbar*.
