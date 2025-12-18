
# Mashroom Portal Demo Pure JS App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This is a pure JS Microfrontend that can be developed and run standalone, but can also
act as a building block in the [Mashroom Portal](../mashroom-portal).

It doesn't use a bundler but just uses ES modules. It also exports the bootstrap function, rather than exposing it as a global variable
(which is necessary if you bundle a Microfrontend to IIFE).

You should not use this approach for a production App, because cache busting of imported ES modules doesn't work.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-portal-demo-pure-js-app** as *dependency*.

Then you can place *Mashroom Portal Demo Pure JS App* on any page via *Portal Admin Toolbar*.
