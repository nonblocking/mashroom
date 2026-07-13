
# Mashroom Server

[Mashroom Server](https://www.mashroom-server.com) is a *Node.js* based **Microfrontend Integration Platform**.

This package contains the core of _Mashroom Server_. It contains core services for managing plugins and default plugin loaders
for *Express* middleware, *Express* webapps and shared code as _services_. It also provides a common logging infrastructure.

From a technical point of view, this is s a plugin loader that scans npm packages (_package.json_) for plugin definitions and loads them at runtime.
Such a plugin could be an *Express* webapp or an *SPA* or more generally all kinds of code it knows how to load,
which is determined by the available plugin loaders.
Plugin loaders itself are also just plugins, so it is possible to extend the list of known plugin types.

## Usage

The easiest way to start is to clone one of the quickstart repositories:
 * [mashroom-quickstart](https://github.com/nonblocking/mashroom-quickstart)
 * [mashroom-portal-quickstart](https://github.com/nonblocking/mashroom-portal-quickstart)

You can find the full documentation with a setup and configuration guide here: [https://docs.mashroom-server.com](https://docs.mashroom-server.com)
