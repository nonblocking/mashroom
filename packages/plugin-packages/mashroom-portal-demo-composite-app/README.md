
# Mashroom Portal Demo Composite App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This is a simple SPA that uses other SPA's (which are registered to the _Mashroom Portal_) as building blocks.
We call this a **Composite App* and it could again be a building block for other Composite Apps.

The SPA itself is written in React but is uses other ones written in Angular, Vue and Svelte to create a dialog.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-demo-composite-app** as *dependency*.

Then you can place it on any page via Portal Admin Toolbar.
