
# Change Log

## [unreleased]

 * Portal: Admin Toolbar cleanup and small fixes
 * Added support for messaging via AMQP (Advanced Messaging Queuing) protocol, supported by almost all message brokers
   (RabbitMQ, Qpid, ActiveMQ, Artemis, Azure Service Bus, ...)
 * Added Remote Portal App registry that automatically scans Kubernetes namespaces for apps
 * Tabify App: The tab buttons have now a new attribute (*data-app-ref*) that contains the id of the corresponding app wrapper div.
   This is useful for end-2-end tests to determine if an app is visible.
 * Sandbox App: Fixed loading of portal apps with bootstrap methods that don't return anything
 * Core: Made it possible to use environment variables in server and plugin configuration. If the config value is a valid
   [template string](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/template_strings) it gets evaluated and the
   environment variables are accessible through the *env* object. Example:
```json
{
    "name": "${env.USER}'s Mashroom Server",
    "port": 5050
}
```
 * Added TypeScript definitions for all API's. Works now similar than with flow:
```javascript
// index.ts
import {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
const bootstrap: MashroomPortalAppPluginBootstrapFunction = (hostElement: HTMLElement, portalAppSetup, portalClientServices) => {
    // ...
}
```

## 1.2.3 (11. January 2020)

 * Core: Added health checks that can for example be used as readiness/liveness probes in Kubernetes (*/mashroom/health*)
 * Core: Moved Admin UI from */mashroom* to */mashroom/admin*
 * Svelte based demo Portal App added
 * Sandbox App: Loads now also shared resources properly
 * Portal: When a portal app gets unloaded all its message bus listeners will automatically be unregistered
   (in case the app does not unregister the listeners properly on onmount)

## 1.2.2 (7. December 2019)

* Forward query parameters to the index page
* Upgraded some dependencies because of security vulnerabilities

## 1.2.1 (25. November 2019)

 * Redis Session Provider: Added cluster support
 * Session Middleware: Log error messages of providers (Redis, MongoDB) properly

## 1.2.0 (15. November 2019)

 * Portal: The Angular 8 demo App can now be loaded multiple times on the same page with a different
   configuration (bootstrap fixed).
 * Portal: Added support for sharing resources between portal apps (e.g. vendor libraries or styles).
   A shared resource with a given name will only loaded once, even if multiple Portal Apps declare it.
   A shared resource can be added like this in the plugin definition:
```json
{
    "name": "Demo Shared DLL App 1",
    "type": "portal-app",
    "bootstrap": "startupDemoSharedDLLApp1",
    "sharedResources": {
        "js": [
            "demo_shared_dll_910502a6fce2f139eff8.js"
        ]
    }
}
```
   Check out the demo project here: https://github.com/nonblocking/mashroom-demo-shared-dll
 * Portal: A remote Portal App which is not reachable for a long time is now unregistered instead of complete removed from the
   list of remote Apps
 * Added MongoDB session provider plugin
 * Added Redis session provider plugin
 * Portal: Show a proper error if a configured Portal App on a page cannot be loaded (instead of showing nothing)

## 1.1.4

 * Core: Logger instances created via _req.pluginContext.loggerFactory('category')_ share now the context with all other loggers created
   from the same request. This can for example be used to output tracing information with each log entry.
   The following context properties will be added automatically to each request:
    * _clientIP_
    * _browser_ (e.g. Chrome, Firefox)
    * _browserVersion_
    * _os_ (e.g. Windows)
    * _sessionID_ (if a session is available)
    * _portalAppName_ (if the request is related to a portal app)
    * _portalAppVersion_ (if the request is related to a portal app)
   To add additional properties to the logger context use the new _logger.addContext()_ method (e.g. within a middleware).
   If you want to output context properties with the log entries you could configure the _log4js_ appender like this:
```
"console": {
    "type": "console",
    "layout": {
        "type": "pattern",
        "pattern": "%d %p %X{sessionID} %X{browser} %X{browserVersion} %X{username} %X{portalAppName} %X{portalAppVersion} %c - %m"
    }
}
```
 * HTTP Proxy: White listed _Jaeger_, _OpenZipkin_ and W3C Trace Context HTTP headers by default
 * HTTP Proxy: Fixed the problem that all requests headers got forwarded to the target, even _cookie_ and other security relevant ones

## 1.1.3 (15. October 2019)

 * Tabify App: Allow to update the title for a specific app id. This is useful for dynamic cockpits where you might
   want to load the same App multiple times in a tabbed area.
 * Portal: Fixed a problem with token highlighting in the add app panel

## 1.1.2 (30. September 2019)

 * Added a middleware plugin that introduces [Helmet](https://helmetjs.github.io) which sets a bunch of protective
   HTTP headers on each response
 * Upgraded some dependencies because of security vulnerabilities

## 1.1.1 (26. September 2019)

 * WebSocket server now sends keep alive messages to prevent reverse proxies and firewalls from closing the connection
 * Portal: _MashroomMessageBus.getRemoteUserPrivateTopic()_ takes now an optional argument _username_ if you want to obtain the private
   topic of a particular user instead of the "own" (the private topic of the authenticated user)

## 1.1.0 (19. September 2019)

 * Portal: Added two new (optional) security related properties to the default config of portal apps:
     * _defaultRestrictViewToRoles_: Same as the previous _defaultRestrictedToRoles_ but renamed to make its purpose clearer.
       These roles can be overwritten via Admin App per App instance in the UI.
     * _restProxy.restrictToRoles_: If this is set only users with one of the given roles can access the rest proxy.
       In contrast to all other permissions the _Administrator_ role has _not_ automatically access.
 * Added a provider plugin to support MQTT as external messaging system
 * Added a demo portal app to demonstrate remote messaging
 * Portal: Added support for remote messaging. Portal apps can now subscribe to server side topics (prefixed with :remote)
   and communicate with apps on other pages and browser tabs. If the service side messaging is connected to an external
   messaging system (e.g. MQTT) it is also possible to subscribe and publish messages to the external system.
 * Added a Service plugin for server-side messaging that comes with a WebSocket interface which allows sending messages
   across clients (and browser tabs). Furthermore it be connected to an external messaging system (such as MQTT) via provider plugin.
 * Core: Added the possibility to listen on Plugin load and unload events via _MashroomPluginService_.
   Useful if you want to cleanup when your plugin unloads or in the rare case where you have to hold
   a plugin instance and want to get notified about an unload or reload.
 * Added a Service plugin to handle WebSocket connections (_mashroom-websocket_)
 * Core: web-app Plugins can now additionally have handlers for upgrade requests (WebSocket support) and for unload
 * Core: The _Middleware_ tab in the Admin UI shows now the actual order of the stack (until now the order was just calculated)

## 1.0.94 (28. August 2019)

 * Portal: Made it configurable when the Portal will start to warn that the authentication is about to expire
 * Renamed _MashroomSecurityProvider.refreshAuthentication()_ to _checkAuthentication()_

## 1.0.93 (27. August 2019)

 * Portal: Added configuration property to automatically extend the authentication (so it stays valid as long as the browser page is opened)
 * Portal: Removed the "auto-logout" feature, instead the Portal warns now when the authentication is about to expire.
 * Decoupled authentication from session, in particular the authentication expiration. This simplifies the implementation for
   providers like OAuth2. **BREAKING CHANGE**: The _MashroomSecurityProvider_ interface has been extended.

## 1.0.92 (12. August 2019)

 * Portal: The app filter in Portal Admin Toolbar considers now _tags_ also.
   And the categories are sorted alphabetically now.
 * Portal: All initial query parameters are now added again after login

## 1.0.91 (9. August 2019)

 * Core: Added optional _tags_ (array) property to the plugin definition
 * Bunch of small default theme improvements
 * Common UI library: Highlight input fields with validation errors
 * Portal: Added a Sandbox App to test Portal Apps.
   It allows it to load any Portal App with a specific configuration and to interact with the App
   via Message Bus. Can also be used for end-2-end testing with tools such as Selenium.

## 1.0.90 (18. July 2019)

First public release
