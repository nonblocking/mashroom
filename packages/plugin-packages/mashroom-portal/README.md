
# Mashroom Portal

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a Portal component which allows composing pages from Single Page Applications (SPA's).

Portal apps can be registered as plugin and placed on arbitrary pages via Drag'n'Drop. Or loaded dynamically via client-side JavaScript API.
It supports i18n, theming and role based security and comes with a client-side message bus.

## Usage

Since this plugin requires a lot of other plugins the easiest way to use it is to clone this quickstart repository: [mashroom-portal-quickstart](https://github.com/nonblocking/mashroom-portal-quickstart)

You can find a full documentation of _Mashroom Server_ and this portal plugin with a setup and configuration guide here: [https://www.mashroom-server.com/documentation](https://www.mashroom-server.com/documentation)

The plugin allows the following configuration properties:

```json
{
  "plugins": {
        "Mashroom Portal WebApp": {
            "path": "/portal",
            "adminApp": "Mashroom Portal Admin App",
            "defaultTheme": "Mashroom Portal Default Theme",
            "defaultLayout": "Mashroom Portal Default Layouts 1 Column",
            "warnBeforeAuthenticationExpiresSec": 120,
            "autoExtendAuthentication": false,
            "defaultProxyConfig": {
                "sendPermissionsHeader": false,
                "restrictToRoles": ["ROLE_X"]
            }
        }
    }
}
```

 * _path_: The portal base path (Default: /portal)
 * _adminApp_: The admin to use (Default: Mashroom Portal Admin App)
 * _defaultTheme_: The default theme if none is selected in the site or page configuration (Default: Mashroom Portal Default Theme)
 * _defaultLayout_: The default layout if none is selected in the site or page configuration (Default: Mashroom Portal Default Layouts 1 Column)
 * _warnBeforeAuthenticationExpiresSec_: The time when the Portal should start to warn that the authentication is about to expire (Default: 120)
 * _autoExtendAuthentication_: Automatically extend the authentication as long as the portal page is open (Default: false)
 * _defaultProxyConfig_: Optional default http proxy config for portal apps (see below the documentation of *portal-app* plugins).
   The *restrictToRoles* here cannot be removed per app, but apps can define other roles that are also allowed to access a proxy.

## Browser support

The Browser support depends on the portal apps and the ES version they require to work. But the latest two versions of all current Browsers should work.

To support older Browsers such as IE the Theme plugin should deliver the required polyfills. The *Mashroom Portal Default Theme* for example delivers
all necessary polyfills for IE11.

## Services

### MashroomPortalService

The exposed service is accessible through _pluginContext.services.portal.service_

**Interface:**

```ts
export interface MashroomPortalService {
    /**
     * Get all registered portal apps
     */
    getPortalApps(): Readonly<Array<MashroomPortalApp>>;

    /**
     * Get all registered theme plugins
     */
    getThemes(): Readonly<Array<MashroomPortalTheme>>;

    /**
     * Get all registered layout plugins
     */
    getLayouts(): Readonly<Array<MashroomPortalLayout>>;

    /**
     * Get all registered page enhancement plugins
     */
    getPortalPageEnhancements(): Readonly<Array<MashroomPortalPageEnhancement>>;

    /**
     * Get all registered app enhancement plugins
     */
    getPortalAppEnhancements(): Readonly<Array<MashroomPortalAppEnhancement>>;

    /**
     * Get all sites
     */
    getSites(limit?: number): Promise<Array<MashroomPortalSite>>;

    /**
     * Get the site with the given id
     */
    getSite(siteId: string): Promise<MashroomPortalSite | null | undefined>;

    /**
     * Find the site with given path
     */
    findSiteByPath(
        path: string,
    ): Promise<MashroomPortalSite | null | undefined>;

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
    getPage(pageId: string): Promise<MashroomPortalPage | null | undefined>;

    /**
     * Find the page ref within a site with given friendly URL
     */
    findPageRefByFriendlyUrl(
        site: MashroomPortalSite,
        friendlyUrl: string,
    ): Promise<MashroomPortalPageRef | null | undefined>;

    /**
     * Find the page ref within a site by the given pageId
     */
    findPageRefByPageId(
        site: MashroomPortalSite,
        pageId: string,
    ): Promise<MashroomPortalPageRef | null | undefined>;

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
    getPortalAppInstance(
        pluginName: string,
        instanceId: string | null | undefined,
    ): Promise<MashroomPortalAppInstance | null | undefined>;

    /**
     * Insert a new portal app instance
     */
    insertPortalAppInstance(
        portalAppInstance: MashroomPortalAppInstance,
    ): Promise<void>;

    /**
     * Update given portal app instance
     */
    updatePortalAppInstance(
        portalAppInstance: MashroomPortalAppInstance,
    ): Promise<void>;

    /**
     * Delete given portal app instance
     */
    deletePortalAppInstance(
        pluginName: string,
        instanceId: string | null | undefined,
    ): Promise<void>;
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
                "type": "portal-app",
                "clientBootstrap": "startMyApp",
                "resources": {
                    "js": [
                        "bundle.js"
                    ]
                },
                "local": {
                    "resourcesRoot": "./dist",
                    "ssrBootstrap": "renderToString.js"
                },
                "defaultConfig": {
                    "appConfig": {
                        "myProperty": "foo"
                    }
                }
            }
        ]
    }
}
```

A full config with all optional properties would look like this:

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
                "category": "My Category",
                "tags": ["my", "stuff"],
                "type": "portal-app",
                "clientBootstrap": "startMyApp",
                "resources": {
                    "js": [
                        "bundle.js"
                    ],
                    "css": []
                },
                "sharedResources": {
                    "js": []
                },
                "screenshots": [
                    "screenshot1.png"
                ],
                "local": {
                    "resourcesRoot": "./dist",
                    "ssrBootstrap": "renderToString.js"
                },
                "remote": {
                    "resourcesRoot": "/public",
                    "ssrInitialHtmlPath": "/ssr"
                },
                "caching": {
                    "ssrHtml": "same-config-and-user"
                },
                "editor": {
                    "editorPortalApp": "Demo Config Editor",
                    "position": "in-place",
                    "appConfig": {
                    }
                },
                "defaultConfig": {
                    "defaultRestrictViewToRoles": ["Role1"],
                    "rolePermissions": {
                        "doSomethingSpecial": ["Role2", "Role3"]
                    },
                    "proxies": {
                        "spaceXApi": {
                            "targetUri": "https://api.spacexdata.com/v3",
                            "sendPermissionsHeader": false,
                            "restrictToRoles": ["Role1"]
                        }
                    },
                    "metaInfo": {
                        "capabilities": ["foo"]
                    },
                    "appConfig": {
                        "myProperty": "foo"
                    }
                }
            }
        ]
    }
}
```

 * _title_: Optional human-readable title of the App. Can be a string or an object with translations.
 * _category_: An optional category to group the Apps in the Admin App
 * _tags_: An optional list of tags that can also be used in the search (in the Admin App)
 * _clientBootstrap_: The global function exposed on the client side to launch the App (see below for an example)
 * _resources_: Javascript and CSS resources that must be loaded before the bootstrap method is invoked. All resource paths are relative to *resourcesRoot*.
 * _sharedResources_: Optional. Same as _resources_ but a shared resource with a given name is only loaded once, even if multiple Portal Apps declare it.
    This is useful if apps want to share vendor libraries or styles or such.
    Here you can find a demo how to use the *Webpack* *DllPlugin* together with this feature: [Mashroom Demo Shared DLL](https://github.com/nonblocking/mashroom-demo-shared-dll)
 * _screenshots_: Optional some screenshots of the App. The screenshots paths are relative to *resourcesRoot*.
 * _local_: Basic configuration if the App is deployed locally
   * _resourcesRoot_: The root path for APP resources such as JavaScript files and images. Needs to be relative within the package
   * _ssrBootstrap_: An optional local SSR bootstrap that returns an initial HTML for the App (see below for an example)
 * _remote_: Optional configuration if the App is accessed remotely
   * _resourcesRoot_: The root path for App resources such as JavaScript files and images
   * _ssrInitialHtmlPath_: The optional path to a route that renders the initial HTML
 * _caching_: Optional caching configuration
   * _ssrHtml_: Optional SSR caching configuration (Default: same-config-and-user)
 * _editor_: Optional custom editor configuration that should be used for the appConfig in the Admin UI
   * _editorPortalApp_: The name of the Portal App that should be used to edit the appConfig of this App
   * _position_: Optional hint where to launch the editor. Possible values: in-place, sidebar. (Default: in-place)
   * _appConfig_: The optional appConfig the editor App should be launched with (Default: {})
 * _defaultConfig_: The default config that can be overwritten in the Mashroom config file
   * _defaultRestrictViewToRoles_: Optional default list of roles that have the VIEW permission if not set via Admin App.
     Use this to prevent that an App can just be loaded via JS API (dynamically) by any user, even an anonymous one.
   * _rolePermissions_: Optional mapping between App specific permissions and roles. This corresponds to the permission object passed with the user information to the App.
   * _proxies_: Defines proxies to access the App's backend (HTTP or WebSocket)
       * _targetUri_: The API target URI
       * _sendPermissionsHeader_: Optional. Add the header _X-USER-PERMISSIONS_ with a comma separated list of permissions calculated from _rolePermissions_ (Default: false)
       * _restrictToRoles_: Optional list of roles that are permitted to access the proxy.
          The difference to using ACL rules to restrict the access to an API is that not even the _Administrator_ role
          can access the proxy if this property is set. You can use this to protect sensitive data only a small group of
          users is allowed to access.
   * _metaInfo_: Optional meta info that could be used to lookup for Apps with specific features or capabilities
   * _appConfig_: The default configuration that will be passed to the App. Can be adapted in the Admin App.

The _clientBootstrap_ is in this case a global function that starts the App within the given host element. Here for example a React app:

```ts
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (element, portalAppSetup, clientServices) => {
    ReactDOM.render(<App appConfig={portalAppSetup.appConfig} messageBus={clientServices.messageBus}/>, element);
    // Or ReactDOM:hydrate() if this is a Hybrid App and a ssrBootstrap is configured

    return {
        willBeRemoved: () => {
            ReactDOM.unmountComponentAtNode(portalAppHostElement);
        },
        updateAppConfig: (appConfig) => {
            // Implement if dynamic app config should be possible
        }
    };
};

global.startMyApp = bootstrap;
```

And for an Angular app:

```ts
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

global.startAngularDemoApp = bootstrap;
```

In case of a Hybrid App which supports Server Side Rendering (SSR) the server side bootstrap would look like this:

```ts
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './App';

import type {MashroomPortalAppPluginSSLBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginSSLBootstrapFunction = (portalAppSetup) => {
    const dummyMessageBus: any = {};
    return ReactDOMServer.renderToString(<App appConfig={portalAppSetup.appConfig} messageBus={dummyMessageBus}/>);
};

export default bootstrap;
```

The _portalAppSetup_ has the following structure:

```ts
export type MashroomPortalAppSetup = {
    readonly appId: string;
    readonly title: string | null | undefined;
    readonly proxyPaths: MashroomPortalProxyPaths;
    // Legacy, will be removed in Mashroom v3
    readonly restProxyPaths: MashroomPortalProxyPaths;
    readonly resourcesBasePath: string;
    readonly globalLaunchFunction: string;
    readonly lang: string;
    readonly user: MashroomPortalAppUser;
    readonly appConfig: MashroomPluginConfig;
    // This will only be set for config editor Apps
    readonly editorTarget?: MashroomPortalConfigEditorTarget;
}
```

 * _appId_: The unique appId
 * _title_: Translated title (according to current _lang_)
 * _proxyPaths_: The base paths to the proxies defined in the plugin config.
   In the example below the base path to the _spaceXApi_ would be in _portalAppSetup.restProxyPaths.spaceXApi._
 * _resourceBasePath_: Base path to access assets in _resourceRoot_ such as images
 * _lang_: The current user language (e.g.: en)
 * _user_: User information such as user name, user display name and roles. It has the following structure:
   ```ts
    export type MashroomPortalAppUser = {
        readonly guest: boolean;
        readonly username: string;
        readonly displayName: string;
        readonly email: string | null;
        readonly permissions: MashroomPortalAppUserPermissions;
        readonly [customProp: string]: any;
    }
   ```
 * _appConfig_: The App config object. The default is defined in _defaultConfig.appConfig_, but it can be overwritten per instance (per Admin App).

The _clientServices_ argument contains the client services, see below.

**Client Services**

The following client side services are available for all portal apps:

 * _MashroomPortalMessageBus_: A simple message bus implementation for inter app communication
 * _MashroomPortalStateService_: State management
 * _MashroomPortalAppService_: Provides methods wo load, unload and reload apps
 * _MashroomPortalUserService_: User management services (such as logout)
 * _MashroomPortalSiteService_: Site services
 * _MashroomPortalPageService_: Page services
 * _MashroomPortalRemoteLogger_: A facility to log messages on the server
 * _MashroomPortalAdminService_: Provides methods to administer sites and pages (only available for users with the _Administrator_ role)

_MashroomPortalMessageBus_

```ts
export interface MashroomPortalMessageBus {
    /**
     * Subscribe to given topic.
     * Topics starting with getRemotePrefix() will be subscribed server side via WebSocket (if available).
     * Remote topics can also contain wildcards: # for multiple levels and + or * for a single level
     * (e.g. remote:/foo/+/bar)
     */
    subscribe(
        topic: string,
        callback: MashroomPortalMessageBusSubscriberCallback,
    ): Promise<void>;

    /**
     * Subscribe once to given topic. The handler will be removed after the first message has been received.
     * Remote topics are accepted.
     */
    subscribeOnce(
        topic: string,
        callback: MashroomPortalMessageBusSubscriberCallback,
    ): Promise<void>;

    /**
     * Unsubscribe from given topic.
     * Remote topics are accepted.
     */
    unsubscribe(
        topic: string,
        callback: MashroomPortalMessageBusSubscriberCallback,
    ): Promise<void>;

    /**
     * Publish to given topic.
     * Remote topics are accepted.
     */
    publish(topic: string, data: any): Promise<void>;

    /**
     * Get the private user topic for the given user or the currently authenticated user if no argument given.
     * You can subscribe to "sub" topics as well, e.g. <private_topic>/foo
     */
    getRemoteUserPrivateTopic(username?: string): string | null | undefined;

    /**
     * The prefix for remote topics
     */
    getRemotePrefix(): string;

    /**
     * Register a message interceptor.
     * A interceptor can be useful for debugging or to manipulate the messages.
     * It is also possible to block messages calling cancelMessage() from the interceptor arguments.
     */
    registerMessageInterceptor(
        interceptor: MashroomPortalMessageBusInterceptor,
    ): void;

    /**
     * Unregister a message interceptor.
     */
    unregisterMessageInterceptor(
        interceptor: MashroomPortalMessageBusInterceptor,
    ): void;
}
```

_MashroomPortalStateService_

```ts
export interface MashroomPortalStateService {
    /**
     * Get a property from state.
     * It will be looked up in the URL (query param or encoded) and in the local and session storage
     */
    getStateProperty(key: string): any | null | undefined;

    /**
     * Add given key value pair into the URL (encoded)
     */
    setUrlStateProperty(key: string, value: any | null | undefined): void;

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

_MashroomPortalAppService_

```ts
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
    loadApp(
        appAreaId: string,
        pluginName: string,
        instanceId: string | null | undefined,
        position?: number | null | undefined,
        overrideAppConfig?: any | null | undefined,
    ): Promise<MashroomPortalLoadedPortalApp>;

    /**
     * Load portal app into a modal overlay.
     *
     * The returned promise will always resolve! If there was a loading error the MashroomPortalLoadedPortalApp.error property will be true.
     */
    loadAppModal(
        pluginName: string,
        title?: string | null | undefined,
        overrideAppConfig?: any | null | undefined,
        onClose?: ModalAppCloseCallback | null | undefined,
    ): Promise<MashroomPortalLoadedPortalApp>;

    /**
     * Reload given portal app
     *
     * The returned promise will always resolve!
     * If there was a loading error the MashroomPortalLoadedPortalApp.error property will be true.
     */
    reloadApp(id: string, overrideAppConfig?: any | null | undefined): Promise<MashroomPortalLoadedPortalApp>;

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
    registerAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener,): void;

    /**
     * Remove listener for unload events
     */
    unregisterAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener,): void;

    /**
     * Load the setup for given app/plugin name on the current page
     */
    loadAppSetup(pluginName: string, instanceId: string | null | undefined): Promise<MashroomPortalAppSetup>;

    /**
     * Prefetch resources of given app/plugin. This is useful if you know which apps you will have to load
     * in the future and want to minimize the loading time.
     */
    prefetchResources(pluginName: string): Promise<void>;

    readonly loadedPortalApps: Array<MashroomPortalLoadedPortalApp>;
}
```

_MashroomPortalUserService_

```ts
export interface MashroomPortalUserService {
    /**
     * Get the authentication expiration time in unix time ms
     */
    getAuthenticationExpiration(): Promise<number | null | undefined>;

    /**
     * Extend the authentication.
     * Can be used to update the authentication when no server interaction has occurred for a while and the authentication is about to expire.
     */
    extendAuthentication(): void;

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

```ts
export interface MashroomPortalSiteService {
    /**
     * Get the base url for the current site
     */
        getCurrentSiteUrl(): string;

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

_MashroomPortalPageService_

```ts
export interface MashroomPortalPageService {
    /**
     * Get current pageId
     */
    getCurrentPageId(): string;
    /**
     * Get the page friendlyUrl from given URL (e.g. /portal/web/test?x=1 -> /test)
     */
    getPageFriendlyUrl(pageUrl: string): string;
    /**
     * Find the pageId for given URL (can be a page friendlyUrl or a full URL as seen by the client).
     */
    getPageId(pageUrl: string): Promise<string | undefined>;
    /**
     * Get the content for given pageId.
     * It also calculates if the correct theme and all necessary page enhancements for the requested page
     * are already loaded. Otherwise fullPageLoadRequired is going to be true and no content returned.
     */
    getPageContent(pageId: string): Promise<MashroomPortalPageContent>;
}
```

_MashroomPortalRemoteLogger_

```ts
export interface MashroomPortalRemoteLogger {
    /**
     * Send a client error to the server log
     */
    error(msg: string, error?: Error): void;

    /**
     * Send a client warning to the server log
     */
    warn(msg: string, error?: Error): void;

    /**
     * Send a client info to the server log
     */
    info(msg: string): void;
}
```

_MashroomPortalAdminService_

```ts
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
    addAppInstance(
        pluginName: string,
        areaId: string,
        position?: number,
        appConfig?: any,
    ): Promise<MashroomPagePortalAppInstance>;

    /**
     * Update given app instance config or position
     */
    updateAppInstance(
        pluginName: string,
        instanceId: string,
        areaId: string | null | undefined,
        position: number | null | undefined,
        appConfig: any | null | undefined,
    ): Promise<void>;

    /**
     * Remove given app instance from page
     */
    removeAppInstance(pluginName: string, instanceId: string): Promise<void>;

    /**
     * Get roles that are permitted to view the app (no roles means everyone is permitted)
     */
    getAppInstancePermittedRoles(
        pluginName: string,
        instanceId: string,
    ): Promise<string[] | null | undefined>;

    /**
     * Update roles that are permitted to view the app (undefined or null means everyone is permitted)
     */
    updateAppInstancePermittedRoles(
        pluginName: string,
        instanceId: string,
        roles: string[] | null | undefined,
    ): Promise<void>;

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
    getPagePermittedRoles(pageId: string): Promise<string[] | null | undefined>;

    /**
     * Update roles that are permitted to view the page (undefined or null means everyone is permitted)
     */
    updatePagePermittedRoles(
        pageId: string,
        roles: string[] | null | undefined,
    ): Promise<void>;

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
    getSitePermittedRoles(siteId: string): Promise<string[] | null | undefined>;

    /**
     * Update roles that are permitted to view the site (undefined or null means everyone is permitted)
     */
    updateSitePermittedRoles(
        siteId: string,
        roles: string[] | null | undefined,
    ): Promise<void>;
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

 * _resourcesRoot_: Folder that contains assets (can be accessed in the theme via *resourcesBasePath*)
 * _views_: The folder with the views. There must exist a view **portal** which renders a portal page

Since *Mashroom Portal* uses the *Express* render mechanism all Template Engines supported by *Express* can be used to define the template.
The bootstrap returns the template engine and the engine name like so:

```ts
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

The theme can contain the following views:

 * *portal*: The portal page (required)
 * *appWrapper*: The wrapper for any Portal App (optional)
 * *appError*: The error message if the loading of a Portal App fails (optional)

A typical *portal* view with *Handlebars* might look like this:

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
            {{{pageContent}}}
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

The _pageContent_ variable contains the actual content with the Portal layout (see below) and the Apps.

### portal-layouts

This plugin type adds portal layouts to the portal. A layout defines a areas where portal-apps can be placed.

To register a new portal-layouts plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
           {
                "name": "My Layouts",
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
 * _layouts_: A map with the layout html files (on the local file system)

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

 ```ts
import {MyRegistry} from './MyRegistry';

import type {MashroomRemotePortalAppRegistryBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomRemotePortalAppRegistryBootstrapFunction = async (pluginName, pluginConfig, pluginContext) => {
    return new MyRegistry();
};

export default bootstrap;

 ```

The plugin must implement the following interface:

```ts
export interface MashroomRemotePortalAppRegistry {
    readonly portalApps: Readonly<Array<MashroomPortalApp>>;
}
```

h3.

### portal-page-enhancement

This plugin type allows it to add extra resources (JavaScript and CSS) to a Portal page based on some (optional) rules.
This can be used to add polyfills or some analytics stuff without the need to change a theme.

To register a new portal-page-enhancement plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
           {
                "name": "My Portal Page Enhancement",
                "type": "portal-page-enhancement",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "pageResources": {
                    "js": [{
                        "path": "my-extra-scripts.js",
                        "rule": "includeExtraScript",
                        "location": "header",
                        "inline": false
                    }],
                    "css": []
                },
                "defaultConfig": {
                    "order": 100,
                    "resourcesRoot": "./dist/public"
                }
            }
        ]
     }
}
```

 * _bootstrap_: Path to the script that contains the bootstrap for the plugin (optional)
 * _pageResources_: A list of JavaScript and CSS resourced that should be added to all portal pages. They can be added
   to the header or footer (location) and can also be inlined. The (optional) rule property refers to a rule in the
   instantiated plugin (bootstrap), see below.
 * _defaultConfig.order_: The weight of the resources- the higher it is the **later** they will be added to the page (Default: 1000)
 * _defaultConfig.resourcesRoot_: The root for all resources (can be a local path or an HTTP url)

The bootstrap returns a map of rules and could look like this:

```ts
import type {MashroomPortalPageEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalPageEnhancementPluginBootstrapFunction = () => {
    return {
        rules: {
            // Example rule: Show only for IE
            includeExtraScript: (sitePath, pageFriendlyUrl, lang, userAgent) => userAgent.browser.name === 'IE',
        }
    }
};

export default bootstrap;
```

The JavaScript or CSS resource can also be generated dynamically by the plugin. In that case it will always be inlined.
To use this state a _dynamicResource_ name instead of a _path_ and include the function that actually generates
the content to the object returned by the bootstrap:

```json
{
     "mashroom": {
        "plugins": [
           {
                "name": "My Portal Page Enhancement",
                "type": "portal-page-enhancement",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "pageResources": {
                    "js": [{
                        "dynamicResource": "extraScript",
                        "location": "header"
                    }],
                    "css": []
                }
            }
        ]
     }
}
```

```ts
import type {MashroomPortalPageEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalPageEnhancementPluginBootstrapFunction = () => {
    return {
        dynamicResources: {
            extraScript: (sitePath, pageFriendlyUrl, lang, userAgent) => `console.info('test');`,
        }
    }
};

export default bootstrap;
```

### portal-app-enhancement

This plugin type allows it to update or rewrite the _portalAppSetup_ that is passed to Portal Apps at startup.
This can be used to add extra config or user properties from a context.
Additionally, this plugin allows it to pass extra _clientServices_ to Portal Apps or replace one of the default ones.

To register a new portal-app-enhancement plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
           {
              "name": "My Portal App Enhancement",
              "type": "portal-app-enhancement",
              "bootstrap": "./dist/mashroom-bootstrap.js",
              "portalCustomClientServices": {
                  "customService": "MY_CUSTOM_SERVICE"
              }
           }
        ]
     }
}
```

 * _bootstrap_: Path to the script that contains the bootstrap for the plugin
 * _portalCustomClientServices_: A map of client services that should be injected in the _clientServices_ object the
  Portal Apps receive. The value (in this example MY_CUSTOM_SERVICE) needs to be an existing global variable on the page (in _window_).

The bootstrap returns the actual enhancer plugin:

```ts
import MyPortalAppEnhancementPlugin from './MyPortalAppEnhancementPlugin';
import type {MashroomPortalAppEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppEnhancementPluginBootstrapFunction = () => {
    return new MyPortalAppEnhancementPlugin();
};

export default bootstrap;
```

The plugin has to implement the following interface:

```ts
export interface MashroomPortalAppEnhancementPlugin {
    /**
     * Enhance the portalAppSetup object passed as the first argument (if necessary)
     */
    enhancePortalAppSetup: (
        portalAppSetup: MashroomPortalAppSetup,
        portalApp: MashroomPortalApp,
        request: Request
    ) => Promise<MashroomPortalAppSetup>;
}
```
