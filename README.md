# Mashroom Server

## About ##

*Mashroom Server* is a *Node.js* based **Microfrontend Integration Platform**. It supports the integration of *Express* webapps on the
server side and composing pages from multiple *Single Page Applications* on the client side (Browser). It also provides common infrastructure such as
security, communication (publish/subscribe), theming, i18n, storage, and logging out of the box and supports custom middleware and services via plugins.

Mashroom Server allows it to implemented SPAs (and express webapps) completely independent and without a vendor lock-in, and to use it on arbitrary pages
with different configurations and even multiple times on the same page. It also allows it to restrict the access to resources (Pages, Apps) based on user roles.

From a technical point of view the core of *Mashroom Server* is a plugin loader that scans npm packages (package.json) for
plugin definitions and loads them at runtime. Such a plugin could be an *Express* webapp or a *SPA* or more generally
all kind of code it knows how to load, which is determined by the available plugin loaders.
Plugin loaders itself are also just plugins, so it is possible to extend the list of known plugin types.

![Mashroom Portal](mashroom_portal_ui.png)

### Key features

#### Portal

  * Registration of Single Page Applications written with any frontend framework
    (basically you just need to implement a startup function and provide some metadata)
  * Automatic registration of SPAs (**Remote Apps**) on remote servers or Kubernetes clusters
    (this allows independent life cycles and teams per SPA)
  * Create static pages with registered SPAs (Apps) as building blocks
  * Support for **dynamic cockpits** where Apps are loaded (and unloaded) based on some user interaction or search results
  * Support for **composite Apps** which can use any registered SPA as building blocks
    (which again can serve as building blocks for other composite Apps)
  * Each App receives a config object which can be different per instance and a number of JavaScript services
    (e.g. to connect to the message bus or to load other Apps)
  * The App config can be edited via Admin Toolbar or a custom Editor App which again is just a plain SPA
  * Client-side message bus for inter-app communication which can be extended to server-side messaging
    (to communicate with Apps in other browsers or even in 3rd party systems)
  * Support for **hybrid rendering** for both the Portal pages and SPAs
    (If an SPA supports server side rendering the initial HTML can be incorporated
    into the initial HTML page. Navigating to another page dynamically replaces the SPAs in the content area via client side rendering)
  * Arbitrary (custom) layouts for pages
  * Extensive **theming** support
    (Themes can be written in any Express template language)
  * Support for multiple sites that can be mapped to virtual hosts
  * Proxying of REST API calls to avoid CORS problems (HTTP, SSE, WebSocket)
  * Support for global libraries that can be shared between multiple SPAs
  * Delivering of Theme and Portal App resources via CDN
  * Admin Toolbar to create pages and place Apps via Drag'n'Drop
  * **Hot reload** of SPAs in development mode

#### Core

  * Shared middlewares and services
  * **Service abstractions** for security, internationalization, messaging, HTTP proxying, memory cache and storage
  * Existing provider plugins for security (OpenID Connect, LDAP), storage (File, MongoDB), messaging (MQTT, AMQP) and caching (Redis)
  * Integration of (existing) _Express_ webapps
  * Integration of (existing) _Express_ (REST) APIs
  * Role and IP based **access control** for URLs
  * Definition of access restrictions for arbitrary resources (such as Sites, Pages, App instances)
  * Single configuration file to override plugin defaults
  * Support for **custom plugin types**
  * Extensive **monitoring** and export in Prometheus format
  * Hot deploy, undeploy and reload of all kind of plugins
  * No compile or runtime dependencies to the server
  * Fast and lightweight

## Quick Start

    git clone https://github.com/nonblocking/mashroom-portal-quickstart
    cd mashroom-portal-quickstart
    npm run setup
    npm start

Open http://localhost:5050 in your browser. Users: john/john, admin/admin

## Homepage

https://www.mashroom-server.com

## Blog

https://medium.com/mashroom-server

## Development

After cloning the repository just run

    npm run setup

to install all dependencies and build the core packages.

To start the test server:

    cd packages/test/test-server1
    npm start

The test server will be available at http://localhost:5050

## Development Resources

### Plugin Examples

https://github.com/nonblocking/mashroom-plugin-demos

### Remote Portal App Demos

 * https://github.com/nonblocking/mashroom-demo-remote-portal-app
 * https://github.com/nonblocking/mashroom-demo-remote-portal-app-ssr (supports server-side rendering)

### Dynamic Cockpit Demo

TODO

### CRM Demo

TODO

### Microfrontend Platform based on Mashroom and Kubernetes Demo

https://github.com/nonblocking/microfrontend-platform-kubernetes

### Full Documentation

https://www.mashroom-server.com/documentation
