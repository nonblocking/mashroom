
# Mashroom Portal

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a Portal component which allows composing pages from SPA Microfrontends, we call Portal Apps.

> [!NOTE]
> The Mashroom Portal supports the type of Microfrontends which is commonly associated with the term, basically some frontend written in SPA technology.
> Since Mashroom supports different types of Microfrontends, we call them here **Portal Apps**.

Registered Microfrontends (Portal Apps) can be placed on arbitrary pages via Drag'n'Drop. Each *instance* receives a **config object** during startup and
a bunch of **client services**, which, for example, allow access to the message bus. The config is basically an arbitrary JSON object, which can be edited via Admin Toolbar.
A Portal App can also bring its own config editor App, which again is a Portal App.

One of the provided client services allows Portal Apps to load any *other* Portal App (known by name) into any existing DOM node. This can be used to:

 * Create **dynamic cockpits** where Apps are loaded dynamically based on some user input or search result
 * Create **Composite Apps** that consist of other Apps (which again could be used within other Apps again)

The Portal supports **hybrid rendering** for both the Portal pages and Portal Apps. So, if the Portal App supports server-side rendering, the initial HTML can be incorporated
into the HTML page. Navigating to another page dynamically replaces the Portal App in the content area via client side rendering (needs to be supported by the Theme).

The Portal also supports **i18n**, **theming**, **role-based security**, a client-side message bus which can be connected to a server-side broker and
a registry for **Portal Apps** on a separate server or container.

## Usage

Since this plugin requires a lot of other plugins, the easiest way to use it is to clone this quickstart repository: [mashroom-portal-quickstart](https://github.com/nonblocking/mashroom-portal-quickstart)

You can find full documentation of _Mashroom Server_ and this portal plugin with a setup and configuration guide here: [https://docs.mashroom-server.com](https://www.mashroom-server.com/documentation)

The plugin allows the following configuration properties:

```json
{
  "plugins": {
        "Mashroom Portal WebApp": {
            "path": "/portal",
            "adminApp": "Mashroom Portal Admin App",
            "defaultTheme": "Mashroom Portal Default Theme",
            "defaultLayout": "Mashroom Portal Default Layouts 1 Column",
            "authenticationExpiration": {
              "warnBeforeExpirationSec": 60,
              "autoExtend": false,
              "onExpiration": {
                "strategy": "reload"
              }
            },
            "ignoreMissingAppsOnPages": false,
            "versionHashSalt": null,
            "resourceFetchConfig": {
                "fetchTimeoutMs": 3000,
                "httpMaxSocketsPerHost": 3,
                "httpRejectUnauthorized": true
            },
            "defaultProxyConfig": {
                "sendPermissionsHeader": false,
                "restrictToRoles": ["ROLE_X"]
            },
            "ssrConfig": {
                "ssrEnable": true,
                "renderTimoutMs": 2000,
                "cacheEnable": true,
                "cacheTTLSec": 300,
                "inlineStyles": true
            },
            "addDemoPages": true
        }
    }
}
```

 * _path_: The portal base path (Default: /portal)
 * _adminApp_: The admin to use (Default: Mashroom Portal Admin App)
 * _defaultTheme_: The default theme if none is selected in the site or page configuration (Default: Mashroom Portal Default Theme)
 * _defaultLayout_: The default layout if none is selected in the site or page configuration (Default: Mashroom Portal Default Layouts 1 Column)
 * _authenticationExpiration_:
   * _warnBeforeExpirationSec_: The time when the Portal should start to warn that the authentication is about to expire.
     A value of 0 or lower than 0 disables the warning. (Default: 60)
   * _autoExtend_: Automatically extend the authentication as long as the portal page is open (Default: false)
   * _onExpiration_: What to do if the session expires. Possible strategies are *stayOnPage*, *reload*, *redirect* and *displayDomElement*. (Default: reload)
 * _ignoreMissingAppsOnPages_: If an App on a page can't be found just show nothing instead of an error message (Default: false)
 * _versionHashSalt_: If you need unique resource version hashes per server instance provide here a string (Default: null)
 * _resourceFetchConfig_: Optional config for resource fetching (App and plugin resources like js/css files)
     * _fetchTimeoutMs_: Timeout for fetching (Default: 3000)
     * _httpMaxSocketsPerHost_: Max sockets per host for fetching resources from Remote Apps (Default: 10)
     * _httpRejectUnauthorized_: Reject resources from servers with invalid certificates (Default: true)
 * _defaultProxyConfig_: Optional default http proxy config for portal apps (see below the documentation of *portal-app2* plugins).
   The *restrictToRoles* here cannot be removed per app, but apps can define other roles that are also allowed to access a proxy.
 * _ssrConfig_: Optional config for server side rendering
   * _ssrEnable_: Allow server side rendering if Apps support it (Default: true)
   * _renderTimoutMs_: Timeout for SSR which defines how long the page rendering can be blocked. Even if SSR takes too long the result is
     put into the cache and might be available for the next page rendering (Default: 2000)
   * _cacheEnable": Enable cache for server-side rendered HTML (Default: true)
   * _cacheTTLSec_: The timeout in seconds for cached SSR HTML (Default: 300)
   * _inlineStyles_: Inline the App's CSS to avoid sudden layout shifts after loading the initial HTML (Default: true)
 * _addDemoPages_: Add some demo pages if the configuration storage is empty (Default: true)

## Provided Services

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
     * Find the site with the given path
     */
    findSiteByPath(path: string): Promise<MashroomPortalSite | null | undefined>;

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
    deleteSite(req: Request, siteId: string): Promise<void>;

    /**
     * Get page with given id
     */
    getPage(pageId: string): Promise<MashroomPortalPage | null | undefined>;

    /**
     * Find the page ref within a site with a given friendly URL
     */
    findPageRefByFriendlyUrl(site: MashroomPortalSite, friendlyUrl: string): Promise<MashroomPortalPageRef | null | undefined>;

    /**
     * Find the page ref within a site by the given pageId
     */
    findPageRefByPageId(site: MashroomPortalSite, pageId: string): Promise<MashroomPortalPageRef | null | undefined>;

    /**
     * Insert a new page
     */
    insertPage(page: MashroomPortalPage): Promise<void>;

    /**
     * Update page
     */
    updatePage(page: MashroomPortalPage): Promise<void>;

    /**
     * Insert a new page
     */
    deletePage(req: Request, pageId: string): Promise<void>;

    /**
     * Get a Portal App instance
     */
    getPortalAppInstance(pluginName: string, instanceId: string | null | undefined): Promise<MashroomPortalAppInstance | null | undefined>;

    /**
     * Insert a new Portal App instance
     */
    insertPortalAppInstance(portalAppInstance: MashroomPortalAppInstance): Promise<void>;

    /**
     * Update given Portal App instance
     */
    updatePortalAppInstance(portalAppInstance: MashroomPortalAppInstance): Promise<void>;

    /**
     * Delete given portal Portal App instance
     */
    deletePortalAppInstance(req: Request, pluginName: string, instanceId: string | null | undefined): Promise<void>;
}
```

## Provided Plugin Types

### portal-app

*Deprecated* since Mashroom v2, please use *portal-app2*.

### portal-app2

This plugin type makes a Microfrontend (Portal App) available in the Portal.

To register a new portal-app plugin, create a plugin definition (mashroom.\[json,ts,js,yaml\]) like this:

```json
{
    "plugins": [
        {
            "name": "My First Microfrontend",
            "type": "portal-app2",
            "clientBootstrap": "startMyMicrofrontend",
            "resources": {
                "js": [
                    "bundle.js"
                ]
            },
            "local": {
                "resourcesRoot": "./dist",
                "ssrBootstrap": "./dist/renderToString.js"
            },
            "defaultConfig": {
                "appConfig": {
                    "myProperty": "foo"
                }
            }
        }
    ]
}
```

A full config with all optional properties would look like this:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My First Microfrontend",
                "type": "portal-app2",
                "clientBootstrap": "startMyMicrofrontend",
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
                    "ssrBootstrap": "/dist/renderToString.js"
                },
                "remote": {
                    "resourcesRoot": "/public",
                    "ssrInitialHtmlPath": "/ssr"
                },
                "defaultConfig": {
                    "title": {
                        "en": "My Single Page App",
                        "de": "Meine Single Page App"
                    },
                    "category": "My Category",
                    "tags": ["my", "stuff"],
                    "description": {
                        "en": "Here the english description",
                        "de": "Hier die deutsche Beschreibung"
                    },
                    "metaInfo": {
                        "capabilities": ["foo"]
                    },
                    "defaultRestrictViewToRoles": ["Role1"],
                    "rolePermissions": {
                        "doSomethingSpecial": ["Role2", "Role3"]
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
                    "proxies": {
                        "spaceXApi": {
                            "targetUri": "https://api.spacexdata.com/v3",
                            "sendPermissionsHeader": false,
                            "restrictToRoles": ["Role1"]
                        }
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

 * _clientBootstrap_: The global function exposed on the client side to launch the App (see below for an example)
 * _resources_: JavaScript and CSS resources that must be loaded before the bootstrap method is invoked. All resource paths are relative to *resourcesRoot*.
 * _sharedResources_: Optional. Same as _resources_ but a shared resource with a given name is only loaded once, even if multiple Portal Apps declare it.
    This is useful if apps want to share vendor libraries or styles or such.
    Here you can find a demo how to use the *Webpack* *DllPlugin* together with this feature: [Mashroom Demo Shared DLL](https://github.com/nonblocking/mashroom-demo-shared-dll)
 * _screenshots_: Optional some screenshots of the App. The screenshot paths are relative to *resourcesRoot*.
 * _local_: Basic configuration if the App is deployed locally
   * _resourcesRoot_: The root path for APP resources such as JavaScript files and images. Needs to be relative within the package
   * _ssrBootstrap_: An optional local SSR bootstrap that returns an initial HTML for the App, relative within the package (see below for an example)
 * _remote_: Optional configuration if the App is accessed remotely
   * _resourcesRoot_: The root path for App resources such as JavaScript files and images
   * _ssrInitialHtmlPath_: The optional path to a route that renders the initial HTML.
     The Portal will send a POST to this route with a JSON body of type *MashroomPortalAppSSRRemoteRequest*
     and expects a plain *text/html* response or an *application/json* response that satisfies *MashroomPortalAppSSRResult*.
 * _defaultConfig_: The default config that can be overwritten in the server config file
    * _title_: Optional human-readable title of the App. Can be a string or an object with translations.
    * _category_: An optional category to group the Apps in the Admin App
    * _tags_: An optional list of tags that can also be used in the search (in the Admin App)
    * _description_: Optional App description. Can be a string or an object with translations.
    * _defaultRestrictViewToRoles_: Optional default list of roles that have the VIEW permission if not set via Admin App.
     Use this to prevent that an App can just be loaded via JS API (dynamically) by any user, even an anonymous one.
    * _rolePermissions_: Optional mapping between App specific permissions and roles. This corresponds to the permission object passed with the user information to the App.
    * _caching_: Optional caching configuration
        * _ssrHtml_: Optional SSR caching configuration (Default: same-config-and-user)
    * _editor_: Optional custom editor configuration that should be used for the *appConfig* by the Admin Toolbar
        * _editorPortalApp_: The name of the Portal App that should be used to edit the *appConfig* of this App.
          The App will receive an extra *appConfig* property *editorTarget* of type *MashroomPortalConfigEditorTarget*.
        * _position_: Optional hint where to launch the editor. Possible values: in-place, sidebar. (Default: in-place)
        * _appConfig_: The optional appConfig the editor App should be launched with (Default: {})
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

```tsx
import React from 'react';
import {createRoot, hydrateRoot, type Root} from 'react-dom/client';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (element, portalAppSetup, clientServices) => {
    const {serverSideRendered, appConfig, restProxyPaths, lang} = portalAppSetup;
    const {messageBus} = clientServices;

    let root: Root;

    //if (serverSideRendered) {
    //   root = hydrateRoot(element, <App appConfig={appConfig} messageBus={messageBus}/>);
    //} else {
        // CSR
        root = createRoot(element);
        root.render(<App appConfig={appConfig} messageBus={messageBus}/>);

    //}

    return {
        willBeRemoved: () => {
            root.unmount();
        },
        updateAppConfig: (appConfig) => {
            // Implement if dynamic app config should be possible
        }
    };
};

global.startMyMicrofrontend = bootstrap;
```

And for an Angular app:

```tsx
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

global.startMyMicrofrontend = bootstrap;
```

In the case of a Hybrid App which supports Server Side Rendering (SSR) the server side bootstrap would look like this:

```tsx
import React from 'react';
import {renderToString} from 'react-dom/server';
import App from './App';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = (portalAppSetup, req) => {
    const {appConfig, restProxyPaths, lang} = portalAppSetup;
    const dummyMessageBus: any = {};
    const html = renderToString(<App appConfig={appConfig} messageBus={dummyMessageBus}/>);

    return html;
    // Alternatively (supports Composite Apps)
    /*
    return {
        html,
        embeddedApps: [],
    }
    */
};

export default bootstrap;
```

The _portalAppSetup_ has the following structure:

```ts
export type MashroomPortalAppSetup = {
    readonly appId: string;
    readonly title: string | null | undefined;
    readonly proxyPaths: MashroomPortalProxyPaths;
    // Legacy, will be removed
    readonly restProxyPaths: MashroomPortalProxyPaths;
    readonly resourcesBasePath: string;
    readonly globalLaunchFunction: string;
    readonly lang: string;
    readonly user: MashroomPortalAppUser;
    readonly appConfig: MashroomPluginConfig;
}
```

 * _appId_: The unique appId
 * _title_: Translated title (according to current _lang_)
 * _proxyPaths_: The base paths to the proxies defined in the plugin config.
   In the example below the base path to the _spaceXApi_ would be in _portalAppSetup.restProxyPaths.spaceXApi._
 * _resourceBasePath_: Base path to access assets in _resourceRoot_ such as images
 * _lang_: The current user language (e.g.: en)
 * _user_: User information such as username, user display name and roles. It has the following structure:
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
     * Subscribe to a given topic.
     * Topics starting with getRemotePrefix() will be subscribed server side via WebSocket (if available).
     * Remote topics can also contain wildcards: # for multiple levels and + or * for a single level
     * (e.g. remote:/foo/+/bar)
     */
    subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void>;

    /**
     * Subscribe once to the given topic. The handler will be removed after the first message has been received.
     * Remote topics are accepted.
     */
    subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void>;

    /**
     * Unsubscribe from the given topic.
     * Remote topics are accepted.
     */
    unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void>;

    /**
     * Publish to the given topic.
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
     * An interceptor can be useful for debugging or to manipulate the messages.
     * It can change the data of an event by returning a different value or block messages
     * by calling cancelMessage() from the interceptor arguments.
     */
    registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor): void;

    /**
     * Unregister a message interceptor.
     */
    unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor): void;
}
```

_MashroomPortalStateService_

```ts
export interface MashroomPortalStateService {
    /**
     * Get a property from the state.
     * It will be looked up in the URL (query param or encoded) and in the local and session storage
     */
    getStateProperty(key: string): any | null | undefined;

    /**
     * Add the given key value pair into the URL (encoded)
     */
    setUrlStateProperty(key: string, value: any | null | undefined): void;

    /**
     * Add the given key value pair to the session storage
     */
    setSessionStateProperty(key: string, value: any): void;

    /**
     * Add the given key value pair to the local storage
     */
    setLocalStoreStateProperty(key: string, value: any): void;
}
```

_MashroomPortalAppService_

```ts
export interface MashroomPortalAppService {
    /**
     * Get all Portal Apps available to the user
     */
    getAvailableApps(): Promise<Array<MashroomAvailablePortalApp>>;

    /**
     * Search for all known Apps.
     */
    searchApps(filter?: AppSearchFilter): Promise<Array<MashroomKnownPortalApp>>;

    /**
     * Load a Portal App into a given host element at a given position (or at the end if the position is not set)
     *
     * The returned promise will always be resolved! If there was a loading error, the MashroomPortalLoadedPortalApp.error property will be true.
     */
    loadApp(appAreaId: string, pluginName: string, instanceId: string | null | undefined, position?: number | null | undefined, overrideAppConfig?: any | null | undefined): Promise<MashroomPortalLoadedPortalApp>;

    /**
     * Load a Portal App into a modal overlay.
     *
     * The returned promise will always be resolved! If there was a loading error, the MashroomPortalLoadedPortalApp.error property will be true.
     */
    loadAppModal(pluginName: string, title?: string | null | undefined, overrideAppConfig?: any | null | undefined, onClose?: ModalAppCloseCallback | null | undefined): Promise<MashroomPortalLoadedPortalApp>;

    /**
     * Reload the given Portal App.
     *
     * The returned promise will always be resolved!
     * If there was a loading error, the MashroomPortalLoadedPortalApp.error property will be true.
     */
    reloadApp(id: string, overrideAppConfig?: any | null | undefined): Promise<MashroomPortalLoadedPortalApp>;

    /**
     * Unload given Portal App.
     */
    unloadApp(id: string): Promise<void>;

    /**
     * Move a loaded App to another area (to another host element within the DOM)
     */
    moveApp(id: string, newAppAreaId: string, newPosition?: number): void;

    /**
     * Loads the Portal App without starting it and returns a reference to the client bootstrap.
     *
     * ONLY use this if you exactly know what you are doing!
     * If you start the Portal App, you have to take care of calling the lifecycle methods yourself.
     */
    loadAppClientBootstrap(pluginName: string): Promise<ClientBootstrapReference>;

    /**
     * Show the name and version for all currently loaded App in an overlay (for debug purposes)
     */
    showAppInfos(customize?: (portalApp: MashroomPortalLoadedPortalApp, overlay: HTMLDivElement) => void): void;

    /**
     * Hide all App info overlays
     */
    hideAppInfos(): void;

    /**
     * Add a listener for load events (fired after an App has been loaded and attached to the page)
     */
    registerAppLoadedListener(listener: MashroomPortalAppLoadListener): void;

    /**
     * Remove a listener for load events
     */
    unregisterAppLoadedListener(listener: MashroomPortalAppLoadListener): void;

    /**
     * Add a listener for unloaded events (fired before an App will be detached from the page)
     */
    registerAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener): void;

    /**
     * Remove a listener for unload events
     */
    unregisterAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener): void;

    /**
     * Load the setup for a given App / plugin name on the current page
     */
    loadAppSetup(pluginName: string, instanceId: string | null | undefined): Promise<MashroomPortalAppSetup>;

    /**
     * Get some stats about a loaded App
     */
    getAppStats(pluginName: string): MashroomPortalLoadedPortalAppStats | null;

    /**
     * Check if some loaded Portal Apps have been updated (and have a different version on the server).
     * This can be used to check if the user should refresh the current page.
     *
     * Returns the list of upgraded Apps.
     */
    checkLoadedPortalAppsUpdated(): Promise<Array<string>>;

    /**
     * Prefetch resources of a given App / plugin. This is useful if you know which apps you will have to load
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
     * Get the authentication expiration time in unix time ms.
     * Returns null if the check fails and "0" if the check returns 403.
     */
    getAuthenticationExpiration(): Promise<number | null>;

    /**
     * Get the unix ms left until authentication expiration.
     * Returns null if the check fails and "0" if the check returns 403.
     */
    getTimeToAuthenticationExpiration(): Promise<number | null>;

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
     * Get the page tree for a given site
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
     * Get the page friendlyUrl from the given URL (e.g., /portal/web/test?x=1 -> /test)
     */
    getPageFriendlyUrl(pageUrl: string): string;
    /**
     * Find the pageId for given URL (can be a page friendlyUrl or a full URL as seen by the client).
     */
    getPageId(pageUrl: string): Promise<string | undefined>;
    /**
     * Get the content for the given pageId.
     * It also calculates if the correct theme and all necessary page enhancements for the requested page
     * are already loaded. Otherwise, fullPageLoadRequired is going to be true and no content returned.
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
     * Get all app instances on the current page
     */
    getAppInstances(): Promise<Array<MashroomPagePortalAppInstance>>;

    /**
     * Add an app to the current page.
     */
    addAppInstance(pluginName: string, areaId: string, position?: number, appConfig?: any): Promise<MashroomPagePortalAppInstance>;

    /**
     * Update given app instance config or position
     */
    updateAppInstance(pluginName: string, instanceId: string, areaId: string | null | undefined, position: number | null | undefined, appConfig: any | null | undefined): Promise<void>;

    /**
     * Remove given app instance from page
     */
    removeAppInstance(pluginName: string, instanceId: string): Promise<void>;

    /**
     * Get roles that are permitted to view the app (no roles means everyone is permitted)
     */
    getAppInstancePermittedRoles(pluginName: string, instanceId: string): Promise<string[] | null | undefined>;

    /**
     * Update roles that are permitted to view the app (undefined or null means everyone is permitted)
     */
    updateAppInstancePermittedRoles(pluginName: string, instanceId: string, roles: string[] | null | undefined): Promise<void>;

    /**
     * Get current pageId
     */
    getCurrentPageId(): string;

    /**
     * Get page data
     */
    getPage(pageId: string): Promise<MashroomPortalPage>;

    /**
     * Add a new page
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
    updatePagePermittedRoles(pageId: string, roles: string[] | null | undefined): Promise<void>;

    /**
     * Get current siteId
     */
    getCurrentSiteId(): string;

    /**
     * Get site with given id
     */
    getSite(siteId: string): Promise<MashroomPortalSite>;

    /**
     * Add a new site
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
    updateSitePermittedRoles(siteId: string, roles: string[] | null | undefined): Promise<void>;
}
```

### portal-theme

This plugin type adds a theme to the Portal.

To register a new portal-theme plugin, create a plugin definition (mashroom.\[json,ts,js,yaml\]) like this:

```json
{
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
```

 * _resourcesRoot_: Folder that contains assets (can be accessed in the theme via *resourcesBasePath*)
 * _views_: The folder with the views. There must exist a view **portal** which renders a portal page

Since *Mashroom Portal* uses the *Express* render mechanism, all Template Engines supported by *Express* can be used to define the template.
The bootstrap returns the template engine and the engine name like so:

```ts
import {engine} from 'express-handlebars';
import path from 'path';

import type {MashroomPortalThemePluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalThemePluginBootstrapFunction = async () => {
    return {
        engineName: 'handlebars',
        engineFactory: () => {
            return engine({
                partialsDir: path.resolve(__dirname, '../views/partials/'),
            });
        },
    };
};

export default bootstrap;

```

> [!NOTE]
> Even if Express.js could automatically load the template engine (like for Pug) you have to provide the *engineFactory* here;
> otherwise plugin local modules cannot be loaded. In that case define the engineFactory like this:
>
> *engineFactory: () => require('pug').__express*

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

    <link rel="stylesheet" type="text/css" href="{{resourcesBasePath}}/style.css">

    {{{portalResourcesHeader}}}

    {{#if page.extraCss}}
        <style>
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

        <div id="portal-page-content" class="mashroom-portal-apps-container container-fluid">
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

Here are all available variables:

```ts
export type MashroomPortalPageRenderModel = {
    readonly portalName: string;
    readonly siteBasePath: string;
    readonly apiBasePath: string;
    readonly resourcesBasePath: string | null | undefined;
    readonly site: MashroomPortalSiteLocalized;
    readonly page: MashroomPortalPage & MashroomPortalPageRefLocalized;
    readonly portalResourcesHeader: string;
    readonly portalResourcesFooter: string;
    readonly pageContent: string;
    // Deprecated, use pageContent
    readonly portalLayout: string;
    readonly lang: string;
    readonly availableLanguages: Readonly<Array<string>>;
    readonly messages: (key: string) => string;
    readonly user: MashroomPortalUser;
    readonly csrfToken: string | null | undefined;
    readonly userAgent: UserAgent;
    readonly lastThemeReloadTs: number;
    readonly themeVersionHash: string;
}
```

### portal-layouts

This plugin type adds portal layouts to the portal. A layout defines areas where portal-apps can be placed.

To register a new portal-layouts plugin, create a plugin definition (mashroom.\[json,ts,js,yaml\]) like this:

```json
{
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

### portal-page-enhancement

This plugin type allows it to add extra resources (JavaScript and CSS) to a Portal page based on some (optional) rules.
This can be used to add polyfills or some analytics stuff without the need to change a theme.

To register a new portal-page-enhancement plugin, create a plugin definition (mashroom.\[json,ts,js,yaml\]) like this:

```json
{
    "plugins": [
        {
            "name": "My Portal Page Enhancement",
            "type": "portal-page-enhancement",
            "bootstrap": "./dist/mashroom-bootstrap.js",
            "resourcesRoot": "./dist/public",
            "pageResources": {
                "js": [{
                    "path": "my-extra-scripts.js",
                    "rule": "includeExtraScript",
                    "location": "header",
                    "inline": false
                }, {
                    "dynamicResource": "myScript",
                    "location": "header"
                }],
                "css": []
            },
            "defaultConfig": {
                "order": 100
            }
        }
    ]
}
```

 * _bootstrap_: Path to the script that contains the bootstrap for the plugin (optional)
 * _resourcesRoot_: The root for all resources (can be a local path or an HTTP url)
 * _pageResources_: A list of JavaScript and CSS resources that should be added to all portal pages.
   They can be static or dynamically generated. And they can be added to the header or footer (location)
   and also be inlined. The (optional) rule property refers to a rule in the instantiated plugin (bootstrap), see below.
 * _defaultConfig.order_: The weight of the resources - the higher it is the **later** they will be added to the page (Default: 1000)

The bootstrap returns a map of rules and could look like this:

```ts
import type {MashroomPortalPageEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalPageEnhancementPluginBootstrapFunction = () => {
    return {
        dynamicResources: {
            myScript: () => `console.info('My Script loaded');`,
        },
        rules: {
            // Example rule: Show only for IE
            includeExtraScript: (sitePath, pageFriendlyUrl, lang, userAgent) => userAgent.browser.name === 'IE',
        }
    }
};

export default bootstrap;
```

The plugin can also generate the JavaScript or CSS resource dynamically. In that case it will always be inlined.
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

To register a new portal-app-enhancement plugin, create a plugin definition (mashroom.\[json,ts,js,yaml\]) like this:

```json
{
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
```

 * _bootstrap_: Path to the script that contains the bootstrap for the plugin (could be omitted if portalCustomClientServices is used)
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
    enhancePortalAppSetup: (portalAppSetup: MashroomPortalAppSetup, portalApp: MashroomPortalApp, request: Request) => Promise<MashroomPortalAppSetup>;
}
```
