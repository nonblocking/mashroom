
# Change Log

## [unreleased]

 * OpenID Connect Security Provider: allow to configure http request timeout

## 1.7.10 (June 22, 2021)

 * Sandbox App: Fixed App container style

## 1.7.9 (June 19, 2021)

 * Core: Added a new property *devModeNpmExecutionTimeoutSec* to the server config to increase the npm execution timeout
   in dev mode on slow computers (default is 180)
 * Sandbox App: The sandbox now uses the "real" message bus and therefore supports Apps that use the message bus
   interceptor, and can also simulate communication with other Apps on the same page.
   Also, the Sandbox can now load itself properly ;-)
 * Portal: MashroomPortalRemoteLogger improved:
     * Added an info() method
     * Fixed client side error serialisation
 * Virtual host path mapper: Make sure the reverse mapped location header is never empty (fixes #79)

## 1.7.8 (May 31, 2021)

 * 3rd party libraries with know vulnerabilities upgraded
 * Angular Demo App: Remove zone.js because it pollutes the public space and possibly influences other Apps
 * Portal: Added the possibility to prefetch Portal App resources (*MashroomPortalAppService.prefetchResources*)
   which is useful if you know which apps you will have to load in the future and want to minimize the loading time.
 * Portal: Fixed loading shared CSS resources
 * Portal: Allow messages with empty data (null or undefined)
 * Portal: Take existing *appConfig* for Portal Apps from server config file even if the App itself has no *appConfig* defined

## 1.7.7 (May 20, 2021)

 * Simple Security Provider, LDAP Security Provider: Fixed adding roles to storage (caused lock exceptions under some circumstances)

## 1.7.6 (May 10, 2021)

 * Portal: Disable the browser caching for all pages if a CSRF token is present, otherwise stale tokens could be used
 * K8S remote app registry: Improved compatibility with Kubernetes 1.20
 * Added the possibility to delay the server shutdown after receiving SIGTERM via environment variable *WAIT_BEFORE_SERVER_CLOSE*,
   which contains the seconds to wait.
   This is required for a non-disruptive rolling deployment on Kubernetes where the kube-proxy takes some time to rewrite iptables.
   It also allows active request to finish properly. See: https://blog.laputa.io/graceful-shutdown-in-kubernetes-85f1c8d586da
 * Http Proxy: Allow it to disable connection keep-alive; mitigates #77
 * Prevented plugins with the same name to silently overwrite each other. If a plugin with the same name already exists
   it will not be loaded anymore, and an error in the Admin UI will be shown
 * Made the *name* property required for all plugins and disallowed some characters like '/' and '?' to prevent problems
   when the name is used in the path
 * LDAP Security Provider: Retry the login if the first attempt fails with ECONNRESET (happens sporadically with Active Directory)
 * Buffering WS messages when client connection is in state "closing". Otherwise, any attempt to send a message produces an error

## 1.7.5 (April 20, 2021)

 * Portal: Cache busting improved:
     * A new property *lastThemeReloadTs* can now be used in themes for resource URLs
     * Added *?v=<lastRelaodTs>* to all resources exposed via Page Enhancement Plugin
 * Error Pages: Fixed the problem that error pages were open to reflected XSS if the $REQUEST_URL was used in the template

## 1.7.4 (March 17, 2021)

 * Fixed bug in the K8S registry

## 1.7.3 (March 17, 2021)

 * K8S Remote App Registry: Just ignore services without a proper descriptor (instead of throwing an error)
 * Http Proxy: Removed double request path URI-decoding in forward method (request path already URI-decoded by Express was decoded again)

## 1.7.2 (March 10, 2021)

 * Portal: Fixed loading of remote Apps with invalid proxy targetUri

## 1.7.1 (March 10, 2021)

 * Fixed the broken mashroom-portal-remote-app-registry-k8s plugin (the K8S connector was not initialized properly)

## 1.7.0 (March 9, 2021)

 * Build under windows fixed
 * Problems with Node 15.x fixed
 * Http Proxy: Fixed encoding of query parameters (already URL encoded parameters were encoded again)
 * Portal: Added the possibility to define a default proxy config for Portal Apps. This is useful if you want to enable the
   permissions header for all Apps
 * Moved out some example plugins to the new https://github.com/nonblocking/mashroom-plugin-demos repo
 * Renamed *mashroom-portal-demo-remote-messaging* to *mashroom-portal-remote-messaging-app* because it's more a test
   util than a demo, just like the sandbox app
 * Admin UI (under /mashroom) polished up
 * Added a new plugin type *admin-ui-integration* to register an arbitrary *web-app* or *static* plugin as panel in the Admin UI
   (will be integrated via iframe)
 * Remote App Registry Kubernetes: **BREAKING CHANGE**: Since it uses ow the new background job scheduler to scan the k8s cluster,
   you also need to add *mashroom-background-jobs* to your dependencies, and the configuration slightly changed.
   Checkout the README in *mashroom-portal-remote-app-registry-k8s*.
 * Remote App Registry: **BREAKING CHANGE**: Since it uses ow the new background job scheduler to scan for remote apps,
   you also need to add *mashroom-background-jobs* to your dependencies, and the configuration slightly changed.
   Checkout the README in *mashroom-portal-remote-app-registry*.
 * Added a background job plugin (*mashroom-background-jobs*) that allows it to schedule arbitrary jobs based on cron expressions
 * HTTP Proxy: Added a second proxy implementation based on [node-http-proxy](https://github.com/http-party/node-http-proxy),
   since [request](https://github.com/request/request) is deprecated. It can be enabled like this in the config:
   ```json
   {
     "Mashroom Http Proxy Services": {
       "proxyImpl": "nodeHttpProxy"
     }
   }
   ```
   Default is still the request based implementation.
 * Migration to TypeScript completed (but flow types are still available).

   The type aliases for express (ExpressRequest, ExpressResponse) are no longer required, so you can directly use the express types.
   E.g. in a middleware plugin:
   ```ts
    import type {Request, Response, NextFunction} from 'express';
    import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

    const myMiddleware = (req: Request, res: Response, next: NextFunction) => {
        const logger = req.pluginContext.loggerFactory('my.middleware');
        logger.info('woohoo');
        // TODO
        next();
    };

    const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig) => {
        return myMiddleware;
    };

    export default bootstrap;
   ```
 * Error Pages: Added the possibility to add default messages if *mashroom-i18n* is not (yet) available
 * LDAP Security Provider: Under all circumstances prevent a login with an empty password since some LDAP servers accept it
   and allow a *simple login*
 * Portal: Load the JS resources for apps sequentially, because if there is more than one bundle they typically depend on each other
 * LDAP Security Provider: Add all roles from the *groupToRoleMapping* and *userToRoleMapping* to the known roles
   to improve the autocomplete in the Admin UI
 * Simple Security Provider: Add all roles from *users.json* to the known roles, to improve the autocomplete in the Admin UI

## 1.6.4 (February 1, 2021)

 * HTTP Proxy: Added an optional *order* property to interceptor configs that allows it to determine the execution order
 * HTTP Proxy: Allow it to intercept/modify the response from the target service
   **BREAKING CHANGE**: The *MashroomHttpProxyInterceptor* interface changed and is not compatible with the previous one:
      * intercept() has been renamed to interceptRequest()
      * A new method interceptResponse() has been added
      * Instead of returning *result.reject* you can now call res.sendStatus() yourself and just return *result.responseHandled* as
        a hint that the proxy doesn't have to do anything.
 * HTTP Proxy: Fixed a problem with special characters in target URIs
 * LDAP Security Provider: Added an optional user to role mapping which is useful if you want to give just a
   specific user access to a Portal page and such.
 * Security: The *MashroomSecurityService.login()* method also returns now a reason if possible (e.g. Invalid credentials).
   This works at the moment for the Simple Provider and the LDAP Provider (only Active Directory and OpenLDAP).
 * Portal: Fixed the client log handler (didn't terminate correctly)

## 1.6.3 (December 20, 2020)

 * Error Pages: Deliver error pages only if text/html explicitly is accepted (and not for xhr/fetch requests).

## 1.6.2 (December 14, 2020)

 * Added a new plugin *mashroom-error-pages* that sends configurable error pages for specific HTTP response codes
 * Portal: Disabled the page caching if the user is authenticated because the back button could reveal sensitive information to other users (on the same machine!).
   See https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/06-Testing_for_Browser_Cache_Weaknesses

## 1.6.1 (November 26, 2020)

 * Portal: Fixed the problem that incomplete pages and sites could be saved in the Portal (which could lead to a corrupt storage)
 * Portal: The *portal-page-enhancement* plugins have now a config property "order" that defines in which order the resources
   are added to a page (useful for polyfills that needs to be started first)
 * Portal: Fixed logout when exposing a site via vhost-path-mapper and *frontendBasePath* is empty or "/"

# 1.6.0 (November 11, 2020)

 * Portal: Decreased start time of static Portal Apps by delivering the appSetup with the Portal Page
 * Core: Plugins are now only built when they changed since the last start. This dramatically decreases the start time in dev mode.
 * Added a new plugin *mashroom-portal-legacy-browser-support* that adds polyfills for legacy browsers (such as IE11) to all portal pages (only if IE detected)
 * Portal: Added a new plugin type *portal-app-enhancement* that allows it to update or rewrite the *portalAppSetup* that is passed to Portal Apps at startup.
   This can be used to add extra appConfig or user properties from a context. Additionally, this plugin allows it to pass extra *clientServices*
   to Portal Apps or replace one of the default ones.
 * Portal: Added a new plugin type *portal-page-enhancement* that allows it to add extra resources (JavaScript and CSS) to a Portal page based on some (optional) rules.
   The resources can also be generated dynamically. This can be used to add polyfills or some analytics stuff without the need to change the theme.
 * HTTP Proxy: The HTTP interceptor plugins now receive the original headers from the incoming request without filtering
 * Portal: Plugin updates are now pushed to the Browser via SSE (in development mode). So, Portal Apps are reloaded faster after an update.
   Also, the portal page reloads on theme or layout changes.
 * Portal: Fixed the problem that the CSRF token was invalidated on public pages when an ajax request was rejected by the ACL check.
   And after the invalidation all subsequent ajax POST's were failing
 * Http Proxy: Fixed nasty bug that caused http headers to be dropped randomly because *RegExp.lastIndex* is not
   reset when test() returns true

## 1.5.4 (October 29, 2020)

 * Portal: The base backend proxy path is now also passed to the apps. This simplifies the handling of mulitple proxis.
   E.g. if you have a proxy definition like this:
   ```json
   {
      "restProxies": {
         "spaceXApi": {
             "targetUri": "https://api.spacexdata.com/v3"
         },
         "secondApi": {
             "targetUri": "..."
         }
     }
   }
   ```
   You could fetch SpaceX's rocket starts like this:
   ```js
     const apiUrl = portalAppSetup.restProxyPaths.__base;
     fetch(`${apiUrl}/spaceXApi/launches/upcoming`)
     // Instead of:
     // fetch(`${portalAppSetup.restProxyPaths.spaceXApi}/launches/upcoming`)
   ```
 * LDAP Security Provider: Added possibility to map arbitrary LDAP attributes to *user.secrets*
 * OpenID Connect security provider: Add the access token to *user.secrets.accessToken* so it could
   for example be used in a Http Proxy Interceptor
 * Simple Security Provider: Allow to set *extraData* and *secrets* for users
 * Added a property *secrets* to the user. In opposite to the *extraData* property the data will never be exposed
   to the browser (e.g. to Portal Apps).
 * Added a plugin that exports Node.js and plugin metrics to PM2 (via pm2/io)
 * Fixed broken support for older browsers (IE11)

## 1.5.3 (October 18, 2020)

 * Core: Show cluster details such as the worker PIDs if the Node.js cluster module is active
 * Http Proxy: Added a new plugin type *http-proxy-interceptor* which allows it to rewrite target URIs and headers.
   This can be used to add security headers to backend calls.
   **BREAKING CHANGE**: The *getApiSecurityHeaders()* method in the security provider interfaces has been removed since
   the http-proxy-interceptor is the more generic approach to solve the same problem.
 * LDAP Security Provider: Added possibility to map arbitrary LDAP attributes to *user.extraData*
 * LDAP Security Provider: Use the LDAP attributes *displayName* or *givenName* + *sn* as displayName instead of *cn*
 * Portal: The *mashroom-portal-demo-alternative-theme* module uses now *express-react-views* and *TypeScript* to demonstrate
   a type save theme template

## 1.5.2 (October 6, 2020)

 * **BREAKING CHANGE**: All paths (config, sessions, ...) are now relative to the Mashroom config file (if they are not absolute)
 * WebSockets: Clients can now reconnect to the previous session and receive missed messages if they use the *clientId* generated by the server
 * LDAP Security Provider: Improved reliability and performance
 * Portal: [ReasonReact](https://reasonml.github.io/reason-react) based demo app added
 * Upgraded libraries with known vulnerabilities

## 1.5.1 (August 25, 2020)

 * Portal: The *MashroomPortalStateService* prefixes now data in the browser storage to avoid conflicts.
   So, its save now to use it to persist the application state like this:
   ```js
        stateService.setLocalStoreStateProperty('state', store.getState());
   ```
 * Portal: Made it possible to use environment variables in the plugin definition of remote portal apps as well
 * Portal: Call the *willBeRemoved* lifecycle hook of all apps on page unload; this gives the app a chance to do some
   cleanup or persist its state properly
 * Portal: Made *defaultTheme* and *defaultLayout* in the site configuration optional and derive it from
   the server configuration if not set

## 1.5.0 (June 14, 2020)

 * Sandbox: Added query parameter *sbPreselectAppName* to preselect an app without loading it
 * Added metrics for: Plugin count, Remote apps, Session count, HTTP proxy pool, WebSocket connections, Redis/MongoDB/MQTT/AMQP connection status
 * Added a plugin that exports the collected metrics for the _Prometheus_ monitoring system
 * Added a metrics collector plugin that adds request metrics and exposes a service for other plugins to add more metrics
 * MongoDB Storage Provider: Added the possibility pass connection properties such as pool size.
   **BREAKING CHANGE**: Renamed the _connectionUri_ property to _uri_.
 * Remote Portal App Registries: Added an option _socketTimeoutSec_ to configure the timeout when trying to access remote apps
 * Storage Service: Can now leverage the new Memory Cache Service to accelerate the access. Can be configured like this:
   ```json
   "Mashroom Storage Services": {
       "provider": "Mashroom Storage Filestore Provider",
       "memoryCache": {
           "enabled": true,
           "ttlSec": 120,
           "invalidateOnUpdate": true,
           "collections": {
               "mashroom-portal-pages": {
                  "ttlSec": 300
               }
           }
       }
   }
   ```
 * Added a Redis provider plugin for the Memory Cache
 * Added a general purpose Memory Cache Service with a built-in provider implementation based on *node-cache*
 * Login web-app: All query parameters in the *redirectUrl* are now preserved after login
 * Core: Added a new property *serverInfo.devMode* to the plugin context that can be used to determine if some packages are in development mode
 * Added a wrapper security provider that adds support for Basic authentication to any other security provider that implements _login()_ properly.
   Useful for end-2-end or load tests and if you want to access some API from an external system.
 * Core: Enable Express "view cache" when no plugin package is in *devMode*,
   even if NODE_ENV is not *production*.

## 1.4.5 (May 5, 2020)

 * Security: A valid response object will now be passed to security providers during a silent login
   (when canAuthenticateWithoutUserInteraction() is true). It was not possible to set cookies.
 * OIDC Security Provider: Fixed *rejectUnauthorized* - didn't work as expected

## 1.4.4 (May 4, 2020)

 * Upgraded libraries with known vulnerabilities
 * Default Login Webapp: Renamed the redirect query parameter to *redirectUrl*
 * Portal: The logout route accepts now a *redirectUrl* parameter with the page that should be redirected to after revoking the authentication
   (default is still the Site's index page)

## 1.4.3 (May 2, 2020)

 * Portal: Keep query parameters when redirecting to default site
 * OIDC Security Provider: Added a *rejectUnauthorized* config property for Identity Providers with self-signed certificates
 * Portal: Fixed mapping of email property in the *portalAppSetup*

## 1.4.2 (April 25, 2020)

 * Security Provider: Added new method *getApiSecurityHeaders(req, targetUri)* that allows it to add security headers to backend/API calls.
   Useful to add extra user context or access tokens to backend requests.
 * Portal: Removed the REST proxy property *sendRoles* because the concept of permissions should be used in backends as well.
 * Portal: If the REST proxy property *sendUserHeaders* is true the following headers will be sent additionally with each REST request:
     * X-USER-DISPLAY-NAME
     * X-USER-EMAIL
 * Portal: Fixed mapping *Sites* to virtual hosts when the frontend base path is /
 * Virtual host path mapper: Added a config property to explicitly set the http headers that
   should be considered (default is *x-forwarded-host*) to determine the actual host

## 1.4.1 (April 20, 2020)

 * Added a virtual host path mapper plugin: Allows it to map internal paths based on virtual hosts and web apps to get
   the actual "frontend path" to generate absolute links at the same time.
   Can be used to expose Portal *Sites* to virtual hosts like so:

   https://www.my-company.com/new-portal -> http://internal-portal-host/portal/web

   For this example configure your reverse proxy to forward calls from *https://www.my-company.com/public* to *http://internal-portal-host/* and
   additionally configure the new plugin like this:

   ```json
   "Mashroom VHost Path Mapper Middleware": {
     "hosts": {
       "www.my-company.com": {
         "frontendBasePath": "/new-portal",
           "mapping": {
             "/login": "/login",
             "/": "/portal/web"
           }
        }
     }
   }
   ```

## 1.4.0 (April 6, 2020)

 * Portal: The *sites* work now completely independent (all URLs are relative to <portal_path>/<site_path>).
   That means in particular you can have both public sites and private (protected) sites at the same time with an ACL configuration like this:
     ```json
       {
         "/portal/public-site/**": {
           "*": {
             "allow": "any"
           }
       }
       "/portal/**": {
         "*": {
           "allow": {
             "roles": ["Authenticated"]
           }
         }
       }
     }
     ```
 * Security: Extended the ACL rules:
   * "any" is now a possible value for allow/deny; this matches also anonymous users which is useful for public sub-pages
   * it is now possible to pass an object to allow/deny with a list of roles and ip addresses
    ```json
    {
      "/portal/**": {
        "*": {
          "allow": {
            "roles": ["Authenticated"],
            "ips": ["10.1.2.*", "168.**"]
          },
          "deny": {
            "ips": ["1.2.3.4"]
          }
        }
      }
    }
    ```
 * Security: Added a new method *canAuthenticateWithoutUserInteraction()* to the Security Provider interface that allows it
   to check if a user could be logged in silently on public pages, which could be desirable
 * Security: Added a new config property to the *mashroom-security* plugin that allows to forward specific query parameters
   to the authorization system (e.g. a hint which identity provider to use):
    ```
    "Mashroom Security Services": {
       "provider": "Mashroom Security Simple Provider",
       "forwardQueryHintsToProvider": ["kc_idp_hint"]
    }
    ```
 * Portal: Fixed anonymous access to pages
 * Added OpenID Connect security provider
 * Angular Demo Portal App: Works now with AOP and the Ivy Compiler
 * External MQTT Messaging Provider: Supports now MQTT 5
 * Removed support for Node 8
 * Added MongoDB storage provider
 * Security: The middleware regenerates the session now before and after a login instead of destroying it.
   Because session.destroy() removes the request.session property completely but some security provider might need a session during authentication.

## 1.3.2 (February 22, 2020)

 * File Storage: Locking works now also on NFS correctly
 * Removed log statements that could expose passwords

## 1.3.1 (February 8, 2020)

 * Remote App Registry Kubernetes: Show all Kubernetes services matching the pattern and a proper error message if no portal apps could be found.
   Remove portal apps after some time if the Kubernetes services disappeared.
 * Remote App Registry: Added plugin config property to hide the *Add a new Remote Portal App Endpoint* form from the Admin UI
 * Remote App Registry: Moved config properties from the *Mashroom Portal Remote App Registry Webapp* plugin to the
   *Mashroom Portal Remote App Registry* plugin where it belongs (**BREAKING CHANGE**)

## 1.3.0 (January 27, 2020)

 * Portal: Fixed broken IE11 support
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
   ```js
     // index.ts
     import {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
     const bootstrap: MashroomPortalAppPluginBootstrapFunction = (hostElement, portalAppSetup, portalClientServices) => {
       // ...
     }
   ```

## 1.2.3 (January 11, 2020)

 * Core: Added health checks that can for example be used as readiness/liveness probes in Kubernetes (*/mashroom/health*)
 * Core: Moved Admin UI from */mashroom* to */mashroom/admin*
 * Svelte based demo Portal App added
 * Sandbox App: Loads now also shared resources properly
 * Portal: When a portal app gets unloaded all its message bus listeners will automatically be unregistered
   (in case the app does not unregister the listeners properly on onmount)

## 1.2.2 (December 7, 2019)

* Forward query parameters to the index page
* Upgraded some dependencies because of security vulnerabilities

## 1.2.1 (November 25, 2019)

 * Redis Session Provider: Added cluster support
 * Session Middleware: Log error messages of providers (Redis, MongoDB) properly

## 1.2.0 (November 15, 2019)

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

## 1.1.4 (October 23, 2019)

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

## 1.1.3 (October 15, 2019)

 * Tabify App: Allow to update the title for a specific app id. This is useful for dynamic cockpits where you might
   want to load the same App multiple times in a tabbed area.
 * Portal: Fixed a problem with token highlighting in the add app panel

## 1.1.2 (September 30, 2019)

 * Added a middleware plugin that introduces [Helmet](https://helmetjs.github.io) which sets a bunch of protective
   HTTP headers on each response
 * Upgraded some dependencies because of security vulnerabilities

## 1.1.1 (September 26, 2019)

 * WebSocket server now sends keep alive messages to prevent reverse proxies and firewalls from closing the connection
 * Portal: _MashroomMessageBus.getRemoteUserPrivateTopic()_ takes now an optional argument _username_ if you want to obtain the private
   topic of a particular user instead of the "own" (the private topic of the authenticated user)

## 1.1.0 (September 19, 2019)

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

## 1.0.94 (August 28, 2019)

 * Portal: Made it configurable when the Portal will start to warn that the authentication is about to expire
 * Renamed _MashroomSecurityProvider.refreshAuthentication()_ to _checkAuthentication()_

## 1.0.93 (August 27, 2019)

 * Portal: Added configuration property to automatically extend the authentication (so it stays valid as long as the browser page is opened)
 * Portal: Removed the "auto-logout" feature, instead the Portal warns now when the authentication is about to expire.
 * Decoupled authentication from session, in particular the authentication expiration. This simplifies the implementation for
   providers like OAuth2. **BREAKING CHANGE**: The _MashroomSecurityProvider_ interface has been extended.

## 1.0.92 (August 12, 2019)

 * Portal: The app filter in Portal Admin Toolbar considers now _tags_ also.
   And the categories are sorted alphabetically now.
 * Portal: All initial query parameters are now added again after login

## 1.0.91 (August 9, 2019)

 * Core: Added optional _tags_ (array) property to the plugin definition
 * Bunch of small default theme improvements
 * Common UI library: Highlight input fields with validation errors
 * Portal: Added a Sandbox App to test Portal Apps.
   It allows it to load any Portal App with a specific configuration and to interact with the App
   via Message Bus. Can also be used for end-2-end testing with tools such as Selenium.

## 1.0.90 (July 18, 2019)

First public release
