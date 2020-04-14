
# Mashroom Portal

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugins adds a Portal component that allows composing pages from Single Page Applications (SPA's).
Portal apps can be registered as plugin and placed on arbitrary pages via Drag'n'Drop. Or loaded dynamically via client-side JavaScript API.
It supports i18n, theming and role based security and comes with a client-side message bus.

## Usage

Since this plugin requires a lot of other plugins the easiest way to use it is to clone this quickstart repository: [mashroom-portal-quickstart](https://github.com/nonblocking/mashroom-portal-quickstart)

You can find a full documentation of _Mashroom Server_ and this portal plugin with a setup and configuration guide here: [https://www.mashroom-server.com/documentation](https://www.mashroom-server.com/documentation)

The plugin allows the following configuration properties:

```json
{
  "plugins": {
        "Plugin: Mashroom Portal WebApp": {
            "path": "/portal",
            "adminApp": "Mashroom Portal Admin App",
            "defaultTheme": "Mashroom Portal Default Theme",
            "warnBeforeAuthenticationExpiresSec": 120,
            "autoExtendAuthentication": false
        }
    }
}
```

 * _path_: The portal base path (Default: /portal)
 * _adminApp_: The admin to use (Default: /Mashroom Portal Admin App)
 * _defaultTheme_: The default theme (Default: Mashroom Portal Default Theme)
 * _warnBeforeAuthenticationExpiresSec_: Defines when the the Portal should start to warn that the authentication is about to expire
 * _autoExtendAuthentication_: Automatically extend the authentication as long as the portal page is open (use with care)


## Browser support

The Browser support depends on the portal apps and the ES version they require to work. But the latest two versions of all current Browsers should work.

To support older Browsers such as IE the Theme plugin should deliver the required polyfills. The *Mashroom Portal Default Theme* for example delivers
all necessary polyfills for IE11.

## Services

### MashroomPortalService

The exposed service is accessible through _pluginContext.services.portal.service_

**Interface:**

```js
export interface MashroomPortalService {
    /**
     * Get all registered portal apps
     */
    getPortalApps(): Array<MashroomPortalApp>;
    /**
     * Get all registered theme plugins
     */
    getThemes(): Array<MashroomPortalTheme>;
    /**
     * Get all registered layout plugins
     */
    getLayouts(): Array<MashroomPortalLayout>;
    /**
     * Get all sites
     */
    getSites(limit?: number): Promise<Array<MashroomPortalSite>>;
    /**
     * Get the site with the given id
     */
    getSite(siteId: string): Promise<?MashroomPortalSite>;
    /**
     * Find the site with given path
     */
    findSiteByPath(path: string): Promise<?MashroomPortalSite>;
    /**
     * Insert new site
     */
    insertSite(site: MashroomPortalSite): Promise<void>;
    /**
     * Update site
     */
    updateSite(site: MashroomPortalSite): Promise<void>;
    /**
     * Delete site
     */
    deleteSite(siteId: string): Promise<void>;
    /**
     * Get page with given id
     */
    getPage(pageId: string): Promise<?MashroomPortalPage>;
    /**
     * Find the page ref within a site with given friendly URL
     */
    findPageRefByFriendlyUrl(site: MashroomPortalSite, friendlyUrl: string): Promise<?MashroomPortalPageRef>;
    /**
     * Insert new page
     */
    insertPage(page: MashroomPortalPage): Promise<void>;
    /**
     * Update page
     */
    updatePage(page: MashroomPortalPage): Promise<void>;
    /**
     * Insert new page
     */
    deletePage(pageId: string): Promise<void>;
    /**
     * Get portal app instance
     */
    getPortalAppInstance(pluginName: string, instanceId: ?string): Promise<?MashroomPortalAppInstance>;
    /**
     * Insert a new portal app instance
     */
    insertPortalAppInstance(portalAppInstance: MashroomPortalAppInstance): Promise<void>;
    /**
     * Update given portal app instance
     */
    updatePortalAppInstance(portalAppInstance: MashroomPortalAppInstance): Promise<void>;
    /**
     * Delete given portal app instance
     */
    deletePortalAppInstance(pluginName: string, instanceId: ?string): Promise<void>;
}
```

## Plugin Types

### portal-app

This plugin type makes a Single Page Application (SPA) available in the Portal.

To register a new portal-app plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
           {
                "name": "My Single Page App",
                "title": {
                    "en": "My Single Page App",
                    "de": "Meine Single Page App"
                },
                "type": "portal-app",
                "bootstrap": "startMyApp",
                "category": "My Category",
                "resources": {
                    "js": [
                        "bundle.js"
                    ],
                    "css": []
                },
                "sharedResources": {
                },
                "defaultConfig": {
                    "resourcesRoot": "./dist",
                    "defaultRestrictViewToRoles": ["Role1"],
                    "rolePermissions": {
                        "doSomethingSpecial": ["Role2", "Role3"]
                    },
                    "restProxies": {
                        "spaceXApi": {
                            "targetUri": "https://api.spacexdata.com/v3",
                            "sendUserHeader": false,
                            "sendRolesHeader": false,
                            "sendPermissionsHeader": false,
                            "sendBearerToken": false,
                            "addHeaders": {},
                            "restrictToRoles": ["Role1"]
                       }
                    },
                    "metaInfo": null,
                    "appConfig": {
                        "myProperty": "foo"
                    }
                }
            }
        ]
     }
}
```

 * _title_: Optional human readable title of the App. Can be a string or a object with translations.
 * _category_: Optional category to group the apps in the admin app
 * _resources_: Javascript and CSS resources that must be loaded before the bootstrap method is invoked
 * _sharedResources_: Optional. Same as _resources_ but a shared resource with a given name is only loaded once, even if multiple Portal Apps declare it.
    This is useful if apps want to share vendor libraries or styles or such.
    Here you can find a demo how to use the *Webpack* *DllPlugin* together with this feature: [Mashroom Demo Shared DLL](https://github.com/nonblocking/mashroom-demo-shared-dll)
 * _defaultConfig_: The default config that can be overwritten in the Mashroom config file
     * _resourcesRoot_: The root path for app resources such as Javascript files and images. This can be a local file path or a http, https or ftp URI.
     * _defaultRestrictViewToRoles_: Optional default list of roles that have the VIEW permission if not set via Admin App.
       If not set, everyone can load the app (even unauthenticated users if the access is not permitted via ACL).
     * _rolePermissions_: Optional mapping between app specific roles. This corresponds to the permission object passed with the user information to the app.
     * _restProxies_: Defines proxies to access the App's backend REST API without violating CORS restrictions.
         * _targetUri_: The target URI
         * _sendUserHeader_: Adds the header _X-USER-NAME_ that contains the authenticated user name
         * _sendRolesHeader_: Adds the header _X-USER-ROLES_ with a comma separated list of roles of the authenticated user
         * _sendPermissionsHeader_: Adds the header _X-USER-PERMISSIONS_ with a comma separated list of permissions calculated from _rolePermissions_
         * _sendBearerToken_: Add the Bearer token from the OIDC/OAuth2 authentication (if any)
         * _addHeaders_: Optional add some extra headers to each request (e.g. BASIC Authentication)
         * _restrictToRoles_: Optional list of roles that are permitted to access the proxy.
            If not set, everyone can load the app (even unauthenticated users if the access is not permitted via ACL).
     * _appConfig_: The default app configuration
     * _metaInfo_: Optional meta info (any type)

The bootstrap is in this case a global function that starts the app within the given host element. Here for example a React app:

```js
// flow

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (element, portalAppSetup, clientServices) => {
    ReactDOM.render(<App appConfig={portalAppSetup.appConfig} messageBus={clientServices.messageBus}/>, element);

    return {
        willBeRemoved: () => {
            ReactDOM.unmountComponentAtNode(portalAppHostElement)
        }
    };
};

global.startMyApp = bootstrap;
```

And in typescript for an Angular app:

```js
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import {AppModule} from './app/app.module';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (hostElement, portalAppSetup, portalClientServices) => {

    return platformBrowserDynamic([
        {provide: 'host.element', useValue: hostElement },
        {provide: 'app.setup', useValue: portalAppSetup},
        {provide: 'client.services', useValue: portalClientServices}
    ]).bootstrapModule(AppModule).then(
        (module) => {
            return {
                willBeRemoved: () => {
                    console.info('Destroying Angular module');
                    module.destroy();
                }
            };
        }
    );
};

global['startAngularDemoApp'] = bootstrap;
```

The _portalAppSetup_ has the following structure:

```js
export type MashroomPortalAppSetup = {
    +pluginName: string,
    +title: ?string,
    +version: string,
    +instanceId: ?string,
    +lastReloadTs: number,
    +restProxyPaths: MashroomRestProxyPaths,
    +resourcesBasePath: string,
    +lang: string,
    +user: MashroomPortalAppUser,
    +appConfig: MashroomPluginConfig
}
```

 * _title_: Translated title (according to current _lang_)
 * _restProxyPaths_: The base paths to the proxies defined in the plugin config.
   In the example below the base path to the _spaceXApi_ would be in _portalAppSetup.restProxyPaths.spaceXApi._
 * _resourceBasePath_: Base path to access assets in _resourceRoot_ such as images
 * _lang_: The current user language (e.g.: en)
 * _user_: User information such as user name, user display name and roles
 * _appConfig_: The app config object. The default is define in _defaultConfig.appConfig_ but it can be overwritten per instance (per admin app).

The _clientServices_ argument contains the client services, see below.

**Client Services**

The following client side services are available for all portal apps:

 * _MashroomPortalAppService_: Provides methods wo load, unload and reload apps
 * _MashroomPortalAdminService_: Provides methods to administer sites and pages (only available for users with the _Administrator_ role)
 * _MashroomPortalMessageBus_: A simple message bus implementation for inter app communication
 * _MashroomRestService_: Convenient methods to access the REST API
 * _MashroomPortalStateService_: State management
 * _MashroomPortalUserService_: User management services (such as logout)
 * _MashroomPortalSiteService_: Site services

_MashroomPortalAppService_

```js
export interface MashroomPortalAppService {
     /**
      * Get all existing apps
      */
     getAvailableApps(): Promise<Array<MashroomAvailablePortalApp>>;

     /**
      * Load portal app to given host element at given position (or at the end if position is not set)
      *
      * The returned promise will always resolve! If there was a loading error the MashroomPortalLoadedPortalApp.error property will be true.
      */
     loadApp(appAreaId: string, pluginName: string, instanceId: ?string, position?: ?number, overrideAppConfig?: ?Object): Promise<MashroomPortalLoadedPortalApp>;
     /**
      * Load portal app into a modal overlay.
      *
      * The returned promise will always resolve! If there was a loading error the MashroomPortalLoadedPortalApp.error property will be true.
      */
     loadAppModal(pluginName: string, title?: ?string, overrideAppConfig?: ?Object, onClose?: ?ModalAppCloseCallback): Promise<MashroomPortalLoadedPortalApp>;
     /**
      * Reload given portal app
      *
      * The returned promise will always resolve! If there was a loading error the MashroomPortalLoadedPortalApp.error property will be true.
      */
     reloadApp(id: string, overrideAppConfig?: ?Object): Promise<MashroomPortalLoadedPortalApp>;
     /**
      * Unload given portal app
      */
     unloadApp(id: string): void;
     /**
      * Move a loaded app to another area (to another host element within the DOM)
      */
     moveApp(id: string, newAppAreaId: string, newPosition?: number): void;
     /**
      * Show the name and version for all currently loaded apps in a overlay (for debug purposes)
      */
     showAppInfos(customize?: (portalApp: MashroomPortalLoadedPortalApp, overlay: HTMLDivElement) => void): void;
     /**
      * Hide all app info overlays
      */
     hideAppInfos(): void;

     /**
      * Add listener for load events (fired after an app has been loaded an attached to the page)
      */
     registerAppLoadedListener(listener: MashroomPortalAppLoadListener): void;
     /**
      * Remove listener for load events
      */
     unregisterAppLoadedListener(listener: MashroomPortalAppLoadListener): void;
     /**
      * Add listener for unload events (fired before an app will been detached from the page)
      */
     registerAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener): void;
     /**
      * Remove listener for unload events
      */
     unregisterAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener): void;

     +loadedPortalApps: Array<MashroomPortalLoadedPortalApp>;
 }
```

_MashroomPortalAdminService_

```js
export interface MashroomPortalAdminService {
    /**
    * Get all existing themes
    */
    getAvailableThemes(): Promise<Array<MashroomAvailablePortalTheme>>;
    /**
    * Get all existing layouts
    */
    getAvailableLayouts(): Promise<Array<MashroomAvailablePortalLayout>>;
    /**
    * Get all currently existing roles
    */
    getExistingRoles(): Promise<Array<RoleDefinition>>;

    /**
    * Get all app instances on current page
    */
    getAppInstances(): Promise<Array<MashroomPagePortalAppInstance>>;
    /**
    * Add an app to the current page.
    */
    addAppInstance(pluginName: string, areaId: string, position?: number, appConfig?: any): Promise<MashroomPagePortalAppInstance>;
    /**
    * Update given app instance config or position
    */
    updateAppInstance(pluginName: string, instanceId: string, areaId: ?string, position: ?number, appConfig: ?any): Promise<void>;
    /**
    * Remove given app instance from page
    */
    removeAppInstance(pluginName: string, instanceId: string): Promise<void>;
    /**
    * Get roles that are permitted to view the app (no roles means everyone is permitted)
    */
    getAppInstancePermittedRoles(pluginName: string, instanceId: string): Promise<?string[]>;
    /**
    * Update roles that are permitted to view the app (undefined or null means everyone is permitted)
    */
    updateAppInstancePermittedRoles(pluginName: string, instanceId: string, roles: ?string[]): Promise<void>;

    /**
    * Get current pageId
    */
    getCurrentPageId(): string;
    /**
    * Get page data
    */
    getPage(pageId: string): Promise<MashroomPortalPage>;
    /**
    * Add new page
    */
    addPage(page: MashroomPortalPage): Promise<MashroomPortalPage>;
    /**
    * Update an existing page
    */
    updatePage(page: MashroomPortalPage): Promise<void>;
    /**
    * Delete the given page
    */
    deletePage(pageId: string): Promise<void>;
    /**
    * Get roles that are permitted to view the page (no roles means everyone is permitted)
    */
    getPagePermittedRoles(pageId: string): Promise<?string[]>;
    /**
    * Update roles that are permitted to view the page (undefined or null means everyone is permitted)
    */
    updatePagePermittedRoles(pageId: string, roles: ?string[]): Promise<void>;

    /**
    * Get current siteId
    */
    getCurrentSiteId(): string;
    /**
    * Get site with given id
    */
    getSite(siteId: string): Promise<MashroomPortalSite>;
    /**
    * Add new site
    */
    addSite(site: MashroomPortalSite): Promise<MashroomPortalSite>;
    /**
    * Update existing site
    */
    updateSite(site: MashroomPortalSite): Promise<void>;
    /**
    * Delete the given site
    */
    deleteSite(siteId: string): Promise<void>;
    /**
    * Get roles that are permitted to view the site (no roles means everyone is permitted)
    */
    getSitePermittedRoles(siteId: string): Promise<?string[]>;
    /**
    * Update roles that are permitted to view the site (undefined or null means everyone is permitted)
    */
    updateSitePermittedRoles(siteId: string, roles: ?string[]): Promise<void>;
}
```

_MashroomPortalMessageBus_

```js
export interface MashroomPortalMessageBus {
    /**
     * Subscribe to given topic.
     * Topics starting with getRemotePrefix() will be subscribed server side via WebSocket (if available).
     * Remote topics can also contain wildcards: # for multiple levels and + or * for a single level
     * (e.g. remote:/foo/+/bar)
     */
    subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void>;
    /**
     * Subscribe once to given topic. The handler will be removed after the first message has been received.
     * Remote topics are accepted.
     */
    subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void>;
    /**
     * Unsubscribe from given topic.
     * Remote topics are accepted.
     */
    unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void>;
    /**
     * Publish to given topic.
     * Remote topics are accepted.
     */
    publish(topic: string, data: any): Promise<void>;
    /**
     * Get the private user topic for the currently authenticated user.
     * You can subscribe to "sub" topics as well, e.g. <private_topic>/foo
     */
    getRemoteUserPrivateTopic(): ?string;
    /**
     * The prefix for remote topics
     */
    getRemotePrefix(): string;
    /**
     * Register a message interceptor.
     * A interceptor can be useful for debugging or to manipulate the messages.
     * It is also possible to block messages by returning 'undefined' or 'null'.
     */
    registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor): void;

    /**
     * Unregister a message interceptor.
     */
    unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor): void;
}
```

_MashroomRestService_

```js
export interface MashroomRestService {
    get(path: string): Promise<any>;
    post(path: string, data: any): Promise<any>;
    put(path: string, data: any): Promise<void>;
    delete(path: string): Promise<void>;
    withBasePath(apiBasePath: string): MashroomRestService;
}
```

_MashroomPortalStateService_

```js
export interface MashroomPortalStateService {
    /**
     * Get a property from state.
     * It will be looked up in the URL (query param or encoded) and in the local and session storage
     */
    getStateProperty(key: string): ?any;
    /**
     * Add given key value pair into the URL (encoded)
     */
    setUrlStateProperty(key: string, value: ?any): void;
    /**
     * Generate a URL with the given state encoded into it
     */
    encodeStateIntoUrl(baseUrl: string, state: any, additionalQueryParams?: ?{[string]: string}, hash?: ?string): string;
    /**
     * Add given key value pair to the session storage
     */
    setSessionStateProperty(key: string, value: any): void;
    /**
     * Add given key value pair to the local storage
     */
    setLocalStoreStateProperty(key: string, value: any): void;
}
```

_MashroomPortalUserService_

```js
export interface MashroomPortalUserService {
    /**
     * Logout the current user
     */
    logout(): Promise<void>;
    /**
     * Get the current user's language
     */
    getUserLanguage(): string;
    /**
     * Set the new user language
     */
    setUserLanguage(lang: string): Promise<void>;
    /**
     * Get all available languages (e.g. en, de)
     */
    getAvailableLanguages(): Promise<Array<string>>;
    /**
     * Get the configured default language
     */
    getDefaultLanguage(): Promise<string>;
}

```

_MashroomPortalSiteService_

```js
export interface MashroomPortalSiteService {
    /**
     * Get the base path for the current site
     */
    getCurrentSitePath(): string;
    /**
     * Get a list with all sites
     */
    getSites(): Promise<Array<MashroomPortalSiteLinkLocalized>>;
    /**
     * Get the page tree for given site
     */
    getPageTree(siteId: string): Promise<Array<MashroomPortalPageRefLocalized>>;
}

```

### portal-theme

This plugin types adds a theme to the Portal.

To register a new portal-theme plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
           {
                "name": "My Theme",
                "type": "portal-theme",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "resourcesRoot": "./dist",
                "views": "./views",
                "defaultConfig": {
                    "param1": true
                 }
            }
        ]
     }
}
```
 * _views_: The folder with the views. There must exist a view _portal_ which renders a portal page

Since *Mashroom Portal* uses the *Express* render mechanism all Template Engines supported by *Express* can be used to define the template.
The bootstrap returns the template engine and the engine name like so:

```js
// @flow

import exphbs from 'express-handlebars';
import path from 'path';

import type {MashroomPortalThemePluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalThemePluginBootstrapFunction = async () => {
    return {
        engineName: 'handlebars',
        engineFactory: () => {
            const hbs = exphbs.create({
                partialsDir: path.resolve(__dirname, '../views/partials/'),
            });
            return hbs.engine;
        },
    };
};


export default bootstrap;

```

A typical portal view with *Handlebars* might look like this:

```html
<!doctype html>
<html>
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <meta name="description" content="{{model.page.description}}">
    <meta name="keywords" content="{{model.page.keywords}}">
    {{#if csrfToken}}
        <meta name="csrf-token" content="{{csrfToken}}">
    {{/if}}

    <title>{{site.title}} - {{page.title}}</title>

    {{#isIE userAgent}}
        <script type="application/javascript" src="{{resourcesBasePath}}/ie_polyfills.js"></script>
    {{/isIE}}

    <link rel="stylesheet" type="text/css" href="{{resourcesBasePath}}/style.css">

    {{{portalResourcesHeader}}}

    {{#if page.extraCss}}
        <style type="text/css">
            {{{page.extraCss}}}
        </style>
    {{/if}}
</head>
<body>
    <div id="mashroom-portal-admin-app-container">
        <!-- Admin app goes here -->
    </div>

    <header>
        <div class="site-name">
            <h1>{{site.title}}</h1>
        </div>
    </header>

    <main>
        {{> navigation}}

        <div class="mashroom-portal-apps-container container-fluid">
            {{{portalLayout}}}
        </div>
    </main>

    <div id="mashroom-portal-modal-overlay">
        <div class="mashroom-portal-modal-overlay-wrapper">
            <div class="mashroom-portal-modal-overlay-header">
                <div id="mashroom-portal-modal-overlay-title">Title</div>
                <div id="mashroom-portal-modal-overlay-close" class="close-button"></div>
            </div>
            <div class="mashroom-portal-modal-overlay-content">
                <div id="mashroom-portal-modal-overlay-app">
                    <!-- Modal apps go here -->
                </div>
            </div>
        </div>
    </div>

    <div id="mashroom-portal-auth-expires-warning">
        <div class="mashroom-portal-auth-expires-warning-message">
            {{{__ messages "authenticationExpiresWarning"}}}
        </div>
    </div>

    {{{portalResourcesFooter}}}
</body>
</html>

```

The _portalLayout_ variable contains the layout with the areas for the portal apps (see below).

### portal-layouts

This plugin type adds portal layouts to the portal. A layout defines a areas where portal-apps can be placed.

To register a new portal-layouts plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
           {
                "name": "Mashroom Portal Default Layouts",
                "type": "portal-layouts",
                "layouts": {
                    "1 Column": "./layouts/1column.html",
                    "2 Columns": "./layouts/2columns.html",
                    "2 Columns 70/30": "./layouts/2columns_70_30.html",
                    "2 Columns with 1 Column Header": "./layouts/2columnsWith1columnHeader.html"
                }
            }
        ]
     }
}
```
 * _layouts_: A map with the layout html files

A layout looks like this:

```html
<div class="row">
    <div class="col-md-8 mashroom-portal-app-area" id="app-area1">
        <!-- Portal apps go here -->
    </div>
    <div class="col-md-4 mashroom-portal-app-area" id="app-area2">
        <!-- Portal apps go here -->
    </div>
</div>
```

Important is the class **mashroom-portal-app-area** and a unique id element.

### remote-portal-app-registry

This plugin type adds an additional registry for remote portal-apps to the Portal.

To register a new remote-portal-app-registry plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
           {
                "name": "Mashroom Portal Remote App Registry",
                "type": "remote-portal-app-registry",
                "bootstrap": "./dist/registry/mashroom-bootstrap-remote-portal-app-registry.js",
                "defaultConfig": {
                    "priority": 100
                }
            }
        ]
     }
}
```

 * _defaultConfig.priority_: Priority of this registry if a portal-app with the same name is registered multiple times (Default: 1)

And the bootstrap must return an implementation of _RemotePortalAppRegistry_:

 ```js
// @flow

import {MyRegistry} from './MyRegistry';

import type {MashroomRemotePortalAppRegistryBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomRemotePortalAppRegistryBootstrapFunction = async (pluginName, pluginConfig, pluginContext) => {
    return new MyRegistry();
};

export default bootstrap;

 ```

The plugin must implement the following interface:

```js
export interface MashroomRemotePortalAppRegistry {
    +portalApps: Array<MashroomPortalApp>;
}
```
