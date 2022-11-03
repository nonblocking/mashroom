
# Mashroom Portal Demo Composite App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This is a simple SPA that uses other SPAs (which are registered to the _Mashroom Portal_) as building blocks.
We call this a **Composite App*, and it could again be a building block for other Composite Apps.

The SPA itself is written in React but is uses other ones implemented with Vue.js, Angular and Svelte to build a dialog.
It is capable of server-side rendering, which includes the *embedded* Apps.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-demo-composite-app** as *dependency*.

Then you can place it on any page via Portal Admin Toolbar.
