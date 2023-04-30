
# Change Log

## [unreleased]

 * Remote Messaging Demo App: Also subscribe to topic *global-notifications* that allows it to broadcast a message
   to all users
 * Helmet Middleware: Fixed default order to avoid ERR_HTTP_HEADERS_SENT errors
 * Core: Added Support for Node.js 20
 * Core: **BREAKING CHANGE** Dropped support for Node.js 14 which reached EOL
 * Core: **BREAKING CHANGE** Renamed the server config property *devModePreferredBuildTool* to *devModeDisableNxSupport*
   which makes more sense, because that was the idea behind the property
 * HTTP Proxy: Added new metrics for WebSocket connections:
   * mashroom_http_proxy_ws_connections_active_total
   * mashroom_http_proxy_ws_connections_active
 * HTTP Proxy: Added the possibility to limit WebSocket connections through the proxy. New config properties:
   * *wsMaxConnectionsTotal* (setting this to 0 disables proxying WS connections)
   * *wsMaxConnectionsPerHost*
 * HTTP Proxy: **BREAKING_CHANGE** Renamed pool metrics
   * mashroom_http_proxy_active_connections_total -> mashroom_http_proxy_http_pool_connections_active_total
   * mashroom_http_proxy_idle_connections_total -> mashroom_http_proxy_http_pool_connections_idle_total
   * mashroom_http_proxy_waiting_requests_total -> mashroom_http_proxy_http_pool_waiting_requests
   * mashroom_https_proxy_active_connections_total -> mashroom_http_proxy_https_pool_connections_active_total
   * mashroom_https_proxy_idle_connections_total -> mashroom_http_proxy_https_pool_connections_idle_total
   * mashroom_https_proxy_waiting_requests_total -> mashroom_http_proxy_https_pool_waiting_requests_total
 * HTTP Proxy: Added additional config properties to fine tune the HTTP connection pool:
   * *poolMaxTotalSockets*
   * *poolMaxSocketsPerHost* (should be used instead of *poolMaxSockets* which is now deprecated)
   * *poolMaxWaitingRequestsPerHost* - limit the number of waiting requests if all connections for a host are already occupied.
     Helps to avoid the problem that a single unresponsive API/backend can fill up the reverse proxy connection pools
     and might render the whole server unreachable - see [#112](https://github.com/nonblocking/mashroom/issues/112)
 * Add User Headers plugin: Remove all characters not allowed in HTTP headers from the display name
 * HTTP Proxy: Added 4 new metrics for active and waiting requests per target URL, see [#111](https://github.com/nonblocking/mashroom/issues/111)
   * mashroom_http_proxy_http_pool_connections_active
   * mashroom_http_proxy_http_pool_waiting_requests
   * mashroom_http_proxy_https_pool_connections_active
   * mashroom_http_proxy_https_pool_waiting_requests
 * Metrics Collector: Added the possibility to reset Gauges, this is useful if some label dynamically "disappear" and need to be removed

## 2.3.2 (April 14, 2023)

 * Core: Added the possibility to set the preferred build tool in the server config (*devModePreferredBuildTool*).
   This can be used to enforce *npm* if you experience troubles with *nx*.
 * Core: Never run *npm install* in dev mode if a given package is not a root module and part of a mono-repo.
   Because in that case running *npm install* might break the lock file; and it is also not possible to detect if running
   it is necessary, because there could simply be no *node_modules* folder because of hoisting.

## 2.3.1 (April 3, 2023)

 * Portal: Added a config property *versionHashSalt* that allows it to generate different resource version hashes per server instance.
   Can be used to make sure future hashes cannot be predicted or if you want to switch between different
   server versions on the same domain without polluting the reverse proxy cache.
 * Portal: Added to property *adminApp* to the page render model, so the Admin panel can be removed if no Admin App has been set.
   Fixes the problem that an empty black panel remained at top in this case.
 * Portal: The client side log now determines correctly which App caused an error, even within Composite Apps

## 2.3.0 (February 10, 2023)

 * Portal: Made sure that the session is not touched for resource requests (images, JS, CSS) and the
   set-cookie header not set. Otherwise, the resources will not be cached by proxy servers.
 * Kubernetes Remote App Registry: If the service port changes the App definition gets reloaded with the next scan
 * Portal: Hot reload of Apps works now on all sites and when *mashroom-vhost-path-mapper* is being used
 * Kubernetes Remote App Registry: Added a config property *unregisterAppsAfterScanErrors* to control if Apps
   should be unregistered if a service cannot be reached anymore
 * Remote App Registry: Added a config property *unregisterAppsAfterScanErrors* to  if Apps
   should be unregistered if an endpoint cannot be reached anymore. This fixes the problem that Apps got unregistered
   if the endpoint was down during the refresh. Default is -1 which means Apps are never unregistered automatically.
   A value of 3 would mean that Apps would be unregistered after 3 retries or 3 minutes if the scan interval is 1 minute.
 * Remote App Registry: Unregister Apps properly if they disappear from an endpoint with multiple Apps
 * Admin Toolbar: If a page gets deleted all subpages are moved up the parent level (until now they just disappeared)
 * Admin Toolbar: Doesn't allow to remove the last Site anymore
 * Portal: Made sure that all related resources are removed from the storage if a Site or Page is deleted (Permissions, App Instances, ...)
 * Portal: Added a method *checkLoadedPortalAppsUpdated()* to the *portalAppService* which allows it to check if the Portal Apps
   loaded in the Browser have been redeployed. This could be used in a (long-running) dynamic cockpit to inform the user
   that some Apps might not work as expected anymore and a reload of the page would be recommended.
 * Sandbox Apps: Shows now the number of loaded resources, the resources size and (if available) the memory usage of the page
 * Portal: The App Info shows now also the number of the loaded resources for an App and the decoded size of those resources
 * Core: Uses [nx](https://nx.dev) for building in dev mode if it is available. This should lead to a much faster startup in dev mode,
   especially if the distributed cloud cache is used.
 * Core: Improved support for [ts-node](https://github.com/TypeStrong/ts-node). If Mashroom runs with ts-node
   all config files can be written in TypeScript. This includes plugin config files.
   Example server config file mashroom.ts:
  ```ts
    import type {MashroomServerConfig} from '@mashroom/mashroom-json-schemas/type-definitions';
    const serverConfig: MashroomServerConfig = {
        name: 'Mashroom Test Server 7',
        port: 5050,
        // ...
    ];
    export default serverConfig;
  ```
 * Portal: Disabled caching of Portal App chunks (from code splitting) that do not include a content hash in the file name.
   Because in that case the Browser would cache the chunk forever even if the content changes.
   If you use webpack you can add the content hash like this to chunk names:
   ```js
    output: {
        // ...
        chunkFilename: 'my-app.[contenthash].js',
    }
   ```
 * Portal: Added support for ES6 modules in Apps. It will automatically be turned on if the bootstrap file name ends with .mjs.
   Checkout the example here: https://github.com/nonblocking/mashroom-plugin-demos/tree/master/packages/mashroom-demo-plain-es6-portal-app
   That is just a neat tech demo, in the real world you should always use a bundler, because loading dozens of uncompressed small
   files is very inefficient, and it is also not possible to load libraries from node_modules.
 * Portal: Added support for code-splitting in shared libraries.
   The only precondition is that the name of the chunks needs to be <shared_lib_base_name>.<chunk_name>.js;
   you would configure that in webpack like this:
   ```js
     output: {
       path: __dirname + '/dist',
       filename: 'my_shared_library.js',
       chunkFilename: 'my_shared_library.[contenthash].js'
     }
   ```
 * Core: Fixed the type of pluginContext.service.<service_ns>: it can now be undefined because the plugin might not be loaded.
   This can be a **BREAKING CHANGE**, and you have to following options to fix TypeScript errors:
   ```ts
    // If the services is added as "required" in the plugin definition
    const requiredService: MashroomSecurityService = pluginContext.services.security!.service;
    // Otherwise
    const optionalService: MashroomSecurityService | unknown = pluginContext.services.security?.service;

    // Alternatively extend MashroomServicePluginNamespaces in a type declaration file
    declare module '@mashroom/mashroom/type-definitions' {
        export interface MashroomServicePluginNamespaces {
            security: { service: MashroomSecurityService; } | /* might not be loaded yet */ undefined;
            // Orther service plugins
        }
    }
   ```

## 2.2.3 (December 19, 2022)

 * Metrics Collector: Replace values in route labels (/my-api/customers/123456 -> /my-api/customers/#val)
 * Core: Properly exit after HTTP server shutdown

## 2.2.2 (December 17, 2022)

 * LDAP Security Provider and Simple Security Provider: Fixed the problem that some URL query parameters got lost after login.
   E.g. an URL like http://localhost:5050/portal/web/test1/sub1?a=1&b=2&c=3 was reduced to http://localhost:5050/portal/web/test1/sub1?a=1 after login.
 * Sandbox App: Introduced a query flag *sbAutoTest* that replaces all code inputs by simple text areas,
   which makes it possible to fill them with automated test tools
 * Core: Fixed shutdown of fs watcher in development mode (hung sometimes)
 * Metrics Collector: Reduced the number generated labels for *mashroom_http_request_* metrics.
   This reduces the Prometheus load, because every label generates a new time series
 * Prometheus Exporter: Fixed a memory leak when the metrics were obtained via PM2 intercom
 * OpenID Connect Security Provider: Fixed the problem that authentication attempts could fail if the IDP redirected back
   very quickly, but the session was not persisted in the store yet
 * Portal: Added the attribute *data-mr-app-name* to the default App wrapper to simplify end-2-end testing
 * Portal: The SSR route of Remote Apps will receive now also the path and the query parameters of the original request
   The body of the POST request looks like this now:
   ```ts
   export type MashroomPortalAppSSRRemoteRequest = {
      readonly originalRequest: {
       readonly path: string;
       readonly queryParameters: Record<string, any>;
     };
     readonly portalAppSetup: MashroomPortalAppSetup;
   }
   ```

## 2.2.1 (November 4, 2022)

 * Portal: Fixed the *MashroomPortalMessageBusInterceptor* signature and behaviour:
   It should be possible to change the event data by just returning a different value;
   but if the interceptor function returns nothing the data should stay untouched (was set to undefined before)
 * Admin Toolbar: Minor style fixes

## 2.2.0 (November 4, 2022)

 * Portal: Fixed the problem that users were kicked out of the Portal when requests to /api/users/authenticated/authExpiration
   failed (see issue #99)
 * Portal: Added support for server-side rendering of *Composite Apps*, which use other Portal Apps as their building blocks.
   It is now possible to define *embedded Portal Apps* in the SSR bootstrap like so:
   ```tsx
    const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup, req) => {
      // Generate server-side HTML that contains a <div id="unique-host-element-id"></div>
      const html = renderToString(<App/>);

      return {
         html,
         embeddedApps: [
            {
                pluginName: 'The other App',
                appConfig: {},
                appAreaId: 'unique-host-element-id',
            }
         ]
      };
    };
   ```
   In the Composite App make sure you don't call ```portalAppService.loadApp()``` for that already integrated App,
   instead you can get the *appId* of the server-side embedded App like this to unload/reload it later:
   ```ts
     const ssrPreloadedApp = portalAppService.loadedPortalApps.find(({ pluginName, portalAppAreaId }) => pluginName === 'The other App' && portalAppAreaId === 'unique-host-element-id');
     let appId;
     if (!ssrPreloadedApp) {
      // SSR failed, load client-side
      const result = await portalAppService.loadApp('host-element-id', 'The other App', null, null, {});
      if (!result.error) {
        appId = result.id;
      }
     } else {
        appId = ssrPreloadedApp.id;
     }
   ```
   Checkout the *mashroom-portal-demo-composite-app* package for a working example.

   **NOTE**: You have to make sure the *embedded* Apps aren't removed by the render framework during hydration,
   in *React* you have to add ```dangerouslySetInnerHTML={{ __html: '' }}``` to nodes whose children shall be ignored during hydration
 * Kubernetes Remote App Registry:
   * Support for multiple Namespace and Service label selectors
   * For duplicate Portal Apps the active one is now more deterministic and depends on the namespace lookup
     (check the README in the *mashroom-portal-remote-app-registry-k8s* package)
   * For multiple Portal Apps per service: if one definition is invalid the other ones will be activated nevertheless
   * Support for duplicate service names in different namespaces
   * If a service gets removed all Portal Apps are unregistered immediately (without delay)
 * Remote App Registry: For multiple Portal Apps per endpoint, if one definition is invalid the other ones will be activated nevertheless
 * Core: Removed the forcefully stopping of the server after 5sec because this may interrupt pending requests.
   It also makes in impossible to increase the shutdown period via *terminationGracePeriodSeconds* on Kubernetes
 * Prometheus Exporter: Added support for Node.js clusters. It is now possible to use *prom-client*'s
   *AggregatorRegistry* to gather the metrics in the master process and also to get the worker metrics
   within a [PM2](https://pm2.keymetrics.io) cluster. Check out the README in the *mashroom-monitoring-prometheus-exporter*
   module for details
 * BREAKING CHANGE: Renamed the plugin *mashroom-http-proxy-add-id-token* to *mashroom-http-proxy-add-access-token* because
   access tokens should be used to make API requests on behalf of a user
 * Core: Failing ready and health probes log now the causes. This is helpful on Kubernetes when the Admin UI is not available
   if the ready probe fails
 * Added a [SolidJS](https://www.solidjs.com) demo Portal App (Microfrontend)
 * Portal: **BREAKING CHANGE**: Themes must set now a CSS variable with the (fontawsome compatible) icon font, like so:
   ```css
     :root {
        --mashroom-portal-font-icon: 'Font Awesome 6 Free';
     }
   ```
 * Portal: Dropped support for IE11 (and all legacy browsers which don't support ES6)
 * Admin Toolbar: Upgrade to CodeMirror 6 with autocomplete support in the CSS editor
 * Admin Toolbar: Cleanup the DOM properly after a drag ends

## 2.1.3 (July 2, 2022)

 * Simple Security Provider, LDAP Security Provider: Prevent a redirect loop if the user has no permission to access the login page

## 2.1.2 (June 14, 2022)

 * Sandbox App, Admin Toolbar: Make sure the chunks get new names when the content changes to avoid problems with browser caching
 * Error Pages: Don't show an error page if the response has content type application/json
 * Core: The health and readiness probes return now a JSON with the actual errors

## 2.1.1 (June 13, 2022)

 * Admin Toolbar: Fixed validation of route '/'

## 2.1.0 (June 13, 2022)

 * Portal: Re-check authentication expiration at least every 60sec, so, if the session for some reason expires (or gets revoked)
   the user will get notified faster.
 * Core: Dropped Node.js 12.x support
 * Portal: Prevent a loop if error messages can not be sent to the server
 * MongoDB Session Provider: **BREAKING CHANGE**: Changed config structure to be able to pass parameters to connect-mongo,
   such as *ttl* and *autoRemove*.

   Before:
   ```json
   {
     "uri": "mongodb://username:password@localhost:27017/mashroom_session_db?connectTimeoutMS=1000&socketTimeoutMS=2500",
     "collection": "sessions",
     "connectionOptions": {
       "poolSize": 5
     }
   }
   ```
   After:
   ```json
   {
     "client": {
       "uri": "mongodb://username:password@localhost:27017/mashroom_session_db?connectTimeoutMS=1000&socketTimeoutMS=2500",
       "connectionOptions": {
          "poolSize": 5
       }
     },
     "collectionName": "sessions",
     "ttl": 86400
   }
   ```
 * Redis Session Provider: **BREAKING CHANGE**: Changed config structure to be able to pass parameters to connect-redis,
   such as *prefix* and *ttl*. Setting *prefix* on this level instead of the Redis client level fixed the session count metric,
   which was broken.

   Before:
   ```json
   {
     "redisOptions": {
       "host": "localhost",
       "port": "6379",
       "keyPrefix": "mashroom:sess:"
     },
     "cluster": false
   }
   ```
   After:
   ```json
   {
     "client": {
       "redisOptions": {
         "host": "localhost",
         "port": "6379",
       },
       "cluster": false
     },
     "prefix": "mashroom:sess:",
     "ttl": 86400
   }
   ```
 * Admin Toolbar: Only allow valid characters (according to RFC 3986) in Routes
 * Admin Toolbar: Added checkbox for client-side routing and renamed *friendlyUrl* to *Route* because that's more what it is.
 * Portal: Added support for client-side routing. If you enable it everything appended to the page URL is ignored.
 * Portal: Added new property *portalAppHost* to the log context of Remote Portal Apps

## 2.0.7 (June 2, 2022)

 * Portal: Switched to cache-control *public* for App resources, even for authenticated users
 * Portal: Fixed cache busting. The v=xxx query parameter is now constant for a plugin version (if the Portal ist not in dev mode).
   You should now replace *lastThemeReloadTs* with *themeVersionHash* in your themes.
 * Security Service: Don't log an error for AJAX requests to restricted resources (just return 403)

## 2.0.6 (June 1, 2022)

 * Remote App Registry and K8S remote app registry: Fixed registering Apps of type _portal-app2_ without SSR capability
 * HTTP Proxy: Added a retry if the target resets or drops the connection (ECONNRESET) which can happen when:
    * _keepAlive_ is activated and a reused connection is broken already (see https://nodejs.org/api/http.html#requestreusedsocket)
    * a Pod/instance is no longer/not yet available
 * HTTP Proxy: Fixed handling of client connection termination.
   Among others the misleading error message 'Target endpoint did not send a response within xxxxx' will no longer be logged
   in the case the client dropped the connection.
 * Portal: State encoded in URL via MashroomPortalStateService is encoded/decoded now

## 2.0.5 (Mai 20, 2022)

 * Portal: The resource and the proxy target URLs of Remote Apps can now overlap as long as requested resources have an extension.
   E.g.: If your plugin definition looks like this:
   ```json
    {
      "name": "My Remote App",
      "type": "portal-app2",
      "remote": {
        "resourcesRoot": "/"
      },
      "defaultConfig": {
        "proxies": {
          "bff": {
            "targetUri": "http://localhost:6089"
          }
        }
      }
    }
   ```
   the Portal will calculate a resource base URL http://yourhost.com/ and a base URL for the _bff_ proxy of http://yourhost.com/,
   so they overlap. Now you can request a resource /index.js with this setup, previously you couldn't, because the Portal has treated
   it as an attempt to fetch API data via (potentially less protected) resource request.
 * Security Service: Start authentication flow (e.g. redirect to the login page) only for GET and non-Ajax requests

## 2.0.4 (Mai 9, 2022)

 * Remote App Registry and K8S remote app registry: Show Apps with errors on top of the list in the Admin UI
 * K8S remote app registry: The Admin UI shows now all successfully registered Apps even if scanning some namespaces fails due to
   missing permissions

## 2.0.3 (Mai 6, 2022)

 * Portal: Fixed Express.js view caching if multiple Themes are involved. If NODE_ENV = production it was possible that
   views from the wrong Theme were used.

## 2.0.2 (Mai 2, 2022)

 * K8S remote app registry: The admin UI shows now the scanned namespaces
 * Portal: If an App on a page cannot be found (if it is not registered (yet)), an error message will be displayed now instead of just showing nothing.
   The old behaviour can be restored by setting the *Mashroom Portal WebApp* config property *ignoreMissingAppsOnPages*.
   On the client side you can check if an App is in error state because the plugin does not exist with
   ```
        clientServices.portalAppService.loadedPortalApps[0].errorPluginMissing;
   ```
 * Portal: Fixed SSR cache key to avoid possible collisions
 * Portal: Added possibility to turn of the SSR cache (even if @mashroom/mashroom-memory-cache is present)
 * OpenID Connect Security Provider: Removed the options *httpRequestRejectUnauthorized* and *httpRequestRetry* because they are no
   longer supported by [openid-client](https://github.com/panva/node-openid-client)
 * Vue Demo App: Upgrade to Vue3 and server-side rendering added
 * Sandbox: Show all Apps for the Administrator role, even if *defaultRestrictViewToRoles* is set

## 2.0.1 (April 25, 2022)

 * VHost Path Mapper: Fixed root url handling

## 2.0.0 (April 25, 2022)

 * Portal: Proxy paths starting with '/' are now accepted for Remote Apps (and considered to be on the server that hosts the App)
 * Portal: Fixed _clientServices.stateService.setUrlStateProperty()_
 * Storage: Added support for _$not_ in filters
 * File Storage: Fixed invalid _totalCount_ if _limit_ was set

## 2.0.0-alpha.4 (March 24, 2022)

 * Portal: The themes expose now CSS variables, which could be used in Microfrontends (Portal Apps)
 * Portal: The Portal tries now to resolve the origin App for all console errors sent to the server.
   The App name and version is appended to the message and added to the log context. See issue #93
 * OpenID Connect Security Provider: If token validation in the callback fails retry authentication instead of just responding with 403
 * LDAP Security Provider: Made username lookup in userToRoleMapping case-insensitive
 * Admin Toolbar: Fixed applying new appConfig after reload
 * Default Login: Improved the style and added another config property *pageTitle* for the title in
   the header (Default is the server name).

## 2.0.0-alpha.3 (February 7, 2022)

 * Admin Toolbar: The Portal App selection shows now the i18n *title* instead of the App name and the i18n *description*
 * Portal: Plugins of type *portal-app2* can now have an internationalized description that will be showed in the Admin Toolbar:
   ```json
   {
       "plugins": [
           {
                "name": "Unique Name For My App",
                // ...
               "defaultConfig": {
                   "title": {
                      "en": "My App",
                      "de": "Meine App"
                   },
                   "description": {
                       "en": "A simple React SPA with cool features",
                       "de": "Ein einfacher React SPA mit tollen Features"
                   },
                   //...
              }
           }
       ]
   }
   ```
 * Portal Default Theme: Inlined critical CSS for performance reasons
 * Portal: Added the Express Request to the SSR bootstrap, so it can access the *pluginContext* (logger, services)
 * VHost Path Mapper: It is now possible to map multiple Portal sites to different base paths on the same virtual host
 * VHost Path Mapper: Fixed reverse mapping of the location header if a *frontendBasePath* exists

## 2.0.0-alpha.2 (February 1, 2022)

 * Storage: Added a new method *updateMany* to update multiple entries at once
 * Portal: Allowed the Theme templates to access the full user, including *extraData*
 * Added health probes for the Remote App registry, so, the server will only be ready once the initial scan has
   been done (otherwise requests will hit instances with missing Apps).
 * Added health probes for Mongo, Redis, MQTT and AMQP. This means, if some plugins (e.g. storage) rely on them,
   the server ready probe (/mashroom/health/ready) will return an error if they are not available.
 * Core: Added the possibility to register **health probes** for plugins.
   Use this if your plugin relies on external service, and you want the flag the instance *not ready* if
   it is not available.
   Usage:
   ```ts
   const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
       const {services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

       healthProbeService.registerProbe(pluginName, healthProbe);

       pluginService.onUnloadOnce(pluginName, () => {
           healthProbeService.unregisterProbe(pluginName);
       });

       // ...
   };
   ```
 * Portal: Disabled browser cache for public pages as well, because they can contain dynamic content from
   enhancement plugins.
 * Storage: **BREAKING CHANGE**: *MashroomStorageCollection.find()* returns now a wrapper object with metadata
   such as the *totalCount* instead of directly the result
 * JSON Schemas: Fixed validation of custom plugin definitions

## 2.0.0-alpha.1 (January 21, 2022)

 * Portal: Prevent misusing resource requests for Remote Apps to access proxy targets
   (if a proxy target is a sub-path of the resource base URL)
 * Portal: Added config property *addDemoPages* to start with an empty Portal if set to false
 * Theme refurbishment: Switched to a new cool logo and a slightly more blueish primary color
 * Portal: Added CDN support for Theme and all Portal App resources. All you need to do is to add *mashroom-cdn* to your
   dependencies and configure it like shown below.
 * Added a CDN Service that can be used to obtain a CDN host to fetch resources. Basically, it just returns a host from
   a configurable list (round-robin):
   ```json
     {
       "Mashroom CDN Services": {
         "cdnHosts": [
           "//cdn1.my-portal.com",
           "//cdn2.my-portal.com"
         ]
       }
     }
   ```
 * Added a middleware to deliver a robots.txt
 * Portal: Added to possibility to define custom App Config editors per Portal App. This is useful for Apps that have
   an editable content (e.g. from a Headless CMS).
   A custom editor is basically just another Portal App (SPA) that receives a special object within the appConfig with the config
   of the target App and a function to update it:
   ```ts
    const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
      const {appConfig: {editorTarget /* MashroomPortalConfigEditorTarget */}} = portalAppSetup;

      const currentAppConfig = editorTarget.appConfig;
      // Open Editor with current config

      // Update with new Config
      editorTarget.updateAppConfig(newAppConfig);
    };
   ```
   In the App that wants to use the editor just update the plugin definition like this:
   ```json
        "defaultConfig": {
          "editor": {
            "editorPortalApp": "My Editor App",
            "position": "in-place"
          }
       }
   ```
   Since the target App remains active it is also possible to use the message bus to exchange information between the editor and the actual App.
 * Portal: Support for Hybrid Apps with server side rendering added.
   When a page is rendered the Portal tries to get the initial HTML for all Apps on in and integrated it into the template.
   The server side HTML will also be cached (if configured). If the server side rendering takes too long (default more than 2000 ms)
   the Portal automatically switches to client side rendering, but puts the result into the cache anyways for subsequent page requests.
   The additional configuration in the *mashroom-portal* plugin looks like this:
   ```json
     {
       "ssrConfig": {
         "ssrEnabled": true,
         "renderTimoutMs": 2000,
         "cacheTTLSec": 300,
         "inlineStyles": true
       }
     }
   ```
 * Portal: New plugin definition for Portal Apps with type **portal-app2** added to be able to integrate new features such as SSR and config editor.
   Changes are compared to *portal-app* are:
   * Moved _title_, _tags_ and _category_ to _defaultConfig_, so it can be overwritten per server instance
   * _bootstrap_ has been renamed to _clientBootstrap_
   * The _resourcesRoot_ can now be defined for local deployment and remote access separately
   * _restProxies_ has been renamed to _proxies_ because the proxy supports all kinds of HTTP and WebSocket connections
   * Caching config added
   * Custom editor config added
   Existing portal-app definitions are still valid, but if you want to upgrade, change the following:
   ```json
     {
       "name": "My Single Page App",
       "title": "My Single Page App",
       "category": "Demo",
       "tags": ["what", "ever"],
       "type": "portal-app",
       "bootstrap": "startMyApp",
       "defaultConfig": {
         "resourcesRoot": "./dist",
         "restProxies": {
            "spaceXApi": {
                "targetUri": "https://api.spacexdata.com/v3",
                "sendPermissionsHeader": false,
                "restrictToRoles": ["Role1"]
            }
         }
       }
     }
   ```
   to:
   ```json
     {
       "name": "My Single Page App",
       "type": "portal-app2",
       "clientBootstrap": "startMyApp",
       "local": {
         "resourcesRoot": "./dist",
         "ssrBootstrap": "optional-ssr-bootstrap-file"
       },
       "remote": {
         "resourcesRoot": "/if-remote-access-supported",
         "ssrInitialHtmlPath": "optional-ssr-route"
       },
       "defaultConfig": {
         "title": "My Single Page App",
         "category": "Demo",
         "tags": ["what", "ever"],
         "caching": {
           "ssrHtml": "same-config-and-user"
         },
         "editor": {
           "editorPortalApp": "My Optional App Config Editor",
           "position": "in-place",
           "appConfig": {
           }
         },
         "proxies": {
            "spaceXApi": {
                "targetUri": "https://api.spacexdata.com/v3",
                "sendPermissionsHeader": false,
                "restrictToRoles": ["Role1"]
            }
         }
       }
     }
   ```
 * Storage: The Storage API (MashroomStorage) supports now a subset of Mongo's filter operations ($gt, $regex, ...),
   sorting and proper paging (skip + limit). So you can do something like:
   ```ts
        await storage.find({ $and: [{ b: { $gt: 1 }}, { x: { $exists: false }}]}, 10, 0, { b: 'asc' })
   ```

## 1.9.3 (January 11, 2022)

 * Portal: Added i18n *title* to MashroomPortalAppService.getAvailableApps()
 * Background Jobs: The *cronSchedule* property is now optional for backend jobs. If you omit it the job will be executed
   exactly **once** at startup. Which is useful if you want to do something during startup.
 * Core: When the build fails, also info gathered from stdout is logged. Tools like eslint use this channel to provide more detailed info about the failure

## 1.9.2 (December 11, 2021)

 * Security: The security providers that rely on the Express Session (Simple, LDAP, OpenID-Connect) are going to log an error now
   if the session configuration is not suitable (e.g. when the access token lives longer than the session that stores it).
 * Browser Cache: Increased the default TTL to 30d to improve the [Lighthouse](https://developers.google.com/web/tools/lighthouse) score.
   Make sure all your resources in the Theme use cache busting or set a lower TTL value for your server like this:
   ```
    {
      "plugins": {
        "Mashroom Cache Control Services": {
          "maxAgeSec": 86400
        }
      }
    }
   ```
 * Portal Default Theme: Fixed setting and updating meta description and keywords
 * Portal Default Theme: Fixed crawlability (some hrefs were missing)
 * MongoDB Session Provider: Fixed startup and detecting connected state
 * Admin Toolbar: Works now if the site path is "/" (because the /portal/my-site is mapped to / via vhost path mapper)
 * Portal: Made sure the *MashroomPortalStateService* works with dynamic routing (when paths are updated via History API)

## 1.9.1 (November 8, 2021)

 * Portal: Fixed loading multiple instances of an App on the same page (was broken due to a caching issue, see issue #89)
 * LDAP Security Provider: Fixed searching for groups if the distinguished name contains special characters (as defined in RFC 2253)

## 1.9.0 (October 18, 2021)

 * Portal: **BREAKING CHANGE**: Removed *portalBasePath* from the page render model because it doesn't make sense in
   combination with the vhost path mapper. Only use *siteBasePath*.
 * Portal: Client log messages contain now the path of the page where they were generated
 * K8S remote app registry: Added the possibility to filter services by [label selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors)
   Example:
   ```json
     "k8sNamespacesLabelSelector": "environment=development,tier=frontend",
     "k8sNamespaces": null,
     "k8sServiceLabelSelector": "microfrontend=true,channel!=alpha"
   ```
 * K8S remote app registry: Added the possibility to scan in namespaces identified by a [labelSelector](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors).
   Example: Scan all services in namespaces with label _environment=development_ and _microfrontend_ in the name:
   ```json
     "k8sNamespacesLabelSelector": "environment=development",
     "k8sNamespaces": null,
     "serviceNameFilter": "(microfrontend-)",
   ```
 * Portal: **BREAKING CHANGE**: Removed *MashroomRestService* from client services because it is only intended
   for internal use. Portal Apps should use *fetch* directly.
 * Default Theme: Added an _SPA mode_ where the theme will try to operate like an SPA and loads new page content via AJAX and replaces the DOM.
   This only works until the user does not navigate on a page with a different theme or different page enhancements, in that case a full page load is triggered.
 * Portal: Added an API endpoint to just fetch the page content without header, navigation, page enhancements and so on.
   This can be used for themes that work like an SPA.
   Example:
   ```http://localhost:5050/portal/web/___/api/pages/test2/content?currentPageId=subpage1```
   Means: Give me the content (and scripts to launch/hydrate the Apps) for page _test2_, and I'm currently
   on page _subpage1_, tell me if I need a full page load because the theme or something else outside
   the content area is different.
 * Portal: Initial pages are now completely rendered on the server side (including the App wrapper).
   To make it more clear that not only the *layout* is rendered anymore, the property *portalLayout* in the render model
   has been deprecated and the new property *pageContent* should be used instead.
 * Portal: It is now possible to define how to render an App and errors during App loading are rendered in the theme.
   You just need to add the new views *appWrapper* and *appError*. The content of *appWrapper* could look like this
   (when using Handlebars):
   ```html
   <div id="portal-app-{{appId}}" class="mashroom-portal-app-wrapper portal-app-{{safePluginName}}">
     <div class="mashroom-portal-app-header">
       <div class="mashroom-portal-app-header-title" data-replace-content="title">{{title}}</div>
     </div>
     <div class="mashroom-portal-app-host" data-replace-content="app">
      {{#if appSSRHtml}}
        {{{appSSRHtml}}}
      {{else}}
        <div class="mashroom-portal-app-loading"><span/></div>
      {{/if}}
    </div>
   </div>
   ```
   **BREAKING CHANGE**: Previously it was possible to customize the App wrapper and error message using the client side
   functions *MashroomPortalCreateAppWrapperFunc* and *MashroomPortalCreateLoadingErrorFunc* - those are ignored now.
 * Default Theme: Added a flag (showPortalAppHeaders) to the config to be able to hide the App headers
 * Admin App: Show/Hide App Control is now persisted during page navigation
 * Added a demo Composite App: Demonstrates the possibility to use existing Apps as building blocks within other Apps.
   Basically it uses the *MashroomPortalAppService* to tell the Portal where it should place an App with a given name and
   a custom appConfig. Additional it demonstrates how such a Composite App can have a "private" message bus.
 * Portal: **BREAKING CHANGE**: Removed *sendUserHeaders* and *addHeaders* from the proxy config of Portal Apps
   because both should be done via HTTP Proxy Interceptor now.
   If you were using *sendUserHeaders* just add *mashroom-http-proxy-add-user-headers* to your plugins.
 * Added a plugin to add the ID/JWT token to backend requests if OpenID connect is used (*mashroom-http-proxy-add-id-token*)
 * Added a plugin to add user data as headers to backend requests (*mashroom-http-proxy-add-user-headers*)
 * HTTP Proxy: The HTTP interceptor can now also process WebSocket upgrade requests
   (added optional method interceptWsRequest())
 * MongoDB client upgraded to v4
   **BREAKING CHANGE**: If you use *mashroom-session-provider-mongodb* or *mashroom-storage-provider-mongodb*
   please check your connection options since they have changed. E.g. *poolSize* and *useUnifiedTopology* no
   longer exist. Check out https://mongodb.github.io/node-mongodb-native/4.1/classes/MongoClient.html#options
 * Admin App: Bundle size cut in halve, loads now faster
 * Sandbox App: It is possible now to search for Apps (autocomplete)
 * Portal: Fixed the problem that pages with special characters (like Umlaute) in their path didn't work

## 1.8.3 (September 11, 2021)

 * HTTP Proxy: The default implementation forwards now query parameters correctly if the base path already
   contains query parameters - fixes #85
 * Sandbox App: Shows only Apps which are available for the authenticated user now
   (previously it also showed Apps that could not be loaded by the user)
 * Admin App: Fixed broken autocomplete of roles
 * Sandbox App: Apps are sorted by their name now

## 1.8.2 (September 6, 2021)

 * Legacy Browser Support: Added a polyfill for *document.currentScript* to support lazy loading via webpack 5 automatic public path
 * Portal: Improved client side error handling; console errors are also logged to the server now and errors are serialized properly
 * HTTP Proxy: Added additional metrics such as the served requests, connection errors and timeouts
 * HTTP Proxy: Fixed the error handling in the node-http-proxy based (default) proxy implementation; this fixes #77
 * WebSocket Demo Portal App: Switched to a working WebSocket echo server
 * Portal: Fixed caching problem in IE11 that confused the auth expiration check

## 1.8.1 (August 23, 2021)

 * Portal: Allow proxies to cache shared resources such as Theme assets and shared page enhancement assets
   (by setting "public" in the Cache-Control header)
 * Portal IFrame App: Waiting until the iframe content is available works now in Chrome also (prevents an empty iframe from being shown)

## 1.8.0 (August 9, 2021)

 * Portal: Fixed login failures due to "ENOENT: no such file or directory" errors when using mashroom-session-provider-filestore under Windows
 * Portal: Reduced the number of session expiration checks to the server
 * OpenID Connect Security Provider: Allowed multiple parallel auth requests.
   This fixes the problem that the login failed if multiple browser tabs were open and triggered the login at the same time.
 * OpenID Connect Security Provider: Reduced the number of token refreshes
 * Added a demo App for WebSocket proxy usage (@mashroom/mashroom-portal-demo-websocket-proxy-app)
 * Portal: The App proxy supports now WebSocket. This means, that Apps (Microfrontends) can open WebSocket connections
   to servers "behind" the Portal. The usual (optional) Security headers going to be sent with the initial
   upgrade/handshake request. Proxy interceptors are ignored for WebSocket connections.
 * HTTP Proxy: Added WebSocket support
 * HTTP Proxy: Fixed rewriting the host header, so forwarding works even if the target server uses virtual hosting
 * HTTP Proxy: The node-http-proxy based implementation is now default
 * Added HTTP/2 support for HTTPS - this currently uses the [node-spdy](https://github.com/spdy-http2/node-spdy)
   modules which has a [known problem with compressed data](https://github.com/spdy-http2/node-spdy/issues/357).
   So, don't use this if your API server compresses responses. Also, don't use this if you rely on WebSocket or SSE.
   To enable it add this to you your server config:
   ```json
   {
      "enableHttp2": true
   }
   ```
 * Added TLS support (HTTPS). Can be enabled like this in the server config:
   ```json
   {
      "httpsPort": 5443,
      "tlsOptions": {
          "key": "./certs/key.pem",
          "cert": "./certs/cert.pem"
      }
   }
   ```
   The tlsOptions are passed to https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
 * Remote App Registry and Remote App Registry Kubernetes: Added support external plugin definitions. The need to be in
   JSON format and also expose on / by the server.
 * Core: Mashroom supports now "external" plugin definition files, so the "mashroom" node in package.json can be in a separate
   file, by default *mashroom.json* or *mashroom.js*. E.g.:
   ```json
   {
       "$schema": "https://www.mashroom-server.com/schemas/mashroom-plugins.json",
       "devModeBuildScript": "build",
       "plugins": [
           {
               "name": "Mashroom Portal Demo React App",
               "type": "portal-app",
               "bootstrap": "startReactDemoApp",
               "resources": {
                   "js": [
                       "bundle.js"
                   ],
                   "css": []
               },
               "defaultConfig": {
                   "resourcesRoot": "./dist"
               }
           }
       ]
   }
   ```
   The possible file name can be changed in the server config via the *externalPluginConfigFileNames* config property.
 * Introduced JSON Schemas for all config files:
   * *package.json*: schemas/mashroom-packagejson-extension.json
   * *mashroom.json* (Server config): schemas/mashroom-server-config.json
   * *acl.json*: schemas/mashroom-security-acl.json
   * *groupToRoleMapping.json*: schemas/mashroom-security-ldap-provider-group-to-role-mapping.json
   * *userToRoleMapping.json*: schemas/mashroom-security-ldap-provider-user-to-role-mapping.json
   * *users.json*: schemas/mashroom-security-simple-provider-users.json
   * *topicACL.json*: schemas/mashroom-security-topic-acl.json
   * *remotePortalApps.json*: schemas/mashroom-portal-remote-apps.json
   The schema can be applied by adding *@mashroom/mashroom-json-schemas* to your dependencies:
   ```json
   {
      "$schema": "./node_modules/@mashroom/mashroom-json-schemas/schemas/mashroom-packagejson-extension.json",
      "name": "my-package"
   }
   ```
   or by using the remote location:
   ```json
   {
      "$schema": "https://www.mashroom-server.com/schemas/mashroom-packagejson-extension.json",
      "name": "my-package"
   }
   ```
 * **BREAKING CHANGE**: All default config file names are now in camel case. The following config files had been renamed:
    * remote-portal-apps.json -> remotePortalApps.json
    * topic_acl.json -> topicACL.json
 * Tabify App: Added the possibility to have fixed titles for the tabs (appConfig.fixedTabTitles)
 * Portal: Added *metaInfo* and *screenshots* to *MashroomPortalAppService.getAvailableApps()* response.
   This allows an App to launch another App based on metadata and could be used to show a preview image.
 * OpenID Connect Security Provider: Allow mapping arbitrary claims to *user.extraData*
 * OpenID Connect Security Provider: Allow configuring HTTP timeout and number of retries when contacting the Authorization Server

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
