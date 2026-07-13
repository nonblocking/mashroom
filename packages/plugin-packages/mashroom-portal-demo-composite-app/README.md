
# Mashroom Portal Demo Composite App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This is a simple Microfrontend that uses other Microfrontends (which are registered to the [Mashroom Portal](../mashroom-portal)) as building blocks.
We call this a **Composite App*, and it could again be a building block for other Composite Apps.

The Microfrontend itself is written in React but uses other ones implemented with Vue.js, Angular and Svelte to build a dialog.
It is capable of server-side rendering, which includes the *embedded* Apps.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-portal-demo-composite-app** as *dependency*.

Then you can place *Mashroom Portal Demo Composite App* on any page via *Portal Admin Toolbar*.
