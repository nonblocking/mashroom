
import type {Request} from 'express';
import type {
    I18NString,
    MashroomPluginConfig,
    MashroomPluginContextHolder
} from '@mashroom/mashroom/type-definitions';

/* Model */

export type MashroomPortalSite = {
    siteId: string;
    readonly title: I18NString;
    readonly path: string;
    readonly virtualHosts?: Array<string>;
    readonly defaultTheme?: string;
    readonly defaultLayout?: string;
    readonly pages: Array<MashroomPortalPageRef>;
};

export type MashroomPortalSiteLocalized = {
    readonly siteId: string;
    readonly title: string;
    readonly path: string;
    readonly pages: Array<MashroomPortalPageRefLocalized>;
};

export type MashroomPortalSiteLinkLocalized = {
    readonly siteId: string;
    readonly title: string;
    readonly path: string;
    readonly url: string;
};

export type MashroomPortalPageRef = {
    readonly pageId: string;
    readonly title: I18NString;
    readonly friendlyUrl: string;
    readonly hidden?: boolean;
    subPages?: Array<MashroomPortalPageRef>;
};

export type MashroomPortalPageRefLocalized = {
    readonly pageId: string;
    readonly title: string;
    readonly friendlyUrl: string;
    readonly hidden?: boolean;
    subPages?: Array<MashroomPortalPageRefLocalized>;
};

export type MashroomPortalPage = {
    readonly pageId: string;
    readonly description?: string;
    readonly keywords?: string;
    readonly theme?: string;
    readonly layout?: string;
    readonly extraCss?: string;
    portalApps?: MashroomPortalApps;
};

export type MashroomPortalApps = {
    [areaId: string]: Array<MashroomPortalAppInstanceRef>;
};

export type MashroomPortalAppInstance = {
    readonly pluginName: string;
    readonly instanceId: string | null | undefined;
    readonly appConfig?: {
        [key: string]: any;
    };
};

export type MashroomPortalAppInstanceRef = {
    readonly pluginName: string;
    readonly instanceId: string | null | undefined;
};

export type MashroomPagePortalAppInstance = {
    readonly pluginName: string;
    readonly instanceId: string | null | undefined;
    readonly areaId: string;
    readonly position: number;
};

export type MashroomCreatePagePortalAppInstance = {
    readonly pluginName: string;
    readonly areaId: string;
    readonly position?: number;
    readonly appConfig?: {
        [key: string]: any;
    };
};

export type MashroomUpdatePagePortalAppInstance = {
    areaId?: string;
    position?: number;
    appConfig?: {
        [key: string]: any;
    };
};

export type RoleDefinition = {
    readonly id: string;
    readonly description?: string;
};

export type MashroomPortalLoadedPortalApp = {
    readonly id: string;
    readonly pluginName: string;
    readonly title: string | null | undefined;
    readonly version: string | null | undefined;
    readonly instanceId: string | null | undefined;
    readonly portalAppAreaId: string;
    readonly portalAppWrapperElement: HTMLDivElement;
    readonly portalAppHostElement: HTMLDivElement;
    readonly portalAppTitleElement: HTMLDivElement;
    readonly appConfig: any;
    readonly error: boolean;
};

export type MashroomRestProxyPaths = {
    __baseUrl: string;
    [id: string]: string;
};

export type MashroomPortalAppUser = {
    readonly guest: boolean;
    readonly username: string;
    readonly displayName: string;
    readonly email: string | null;
    readonly permissions: MashroomPortalAppUserPermissions;
    readonly [customProp: string]: any;
};

export type MashroomPortalAppUserPermissions = {
    [permission: string]: boolean;
};

export type MashroomPortalAppSetup = {
    readonly pluginName: string;
    readonly title: string | null | undefined;
    readonly version: string;
    readonly instanceId: string | null | undefined;
    readonly lastReloadTs: number;
    readonly restProxyPaths: MashroomRestProxyPaths;
    readonly sharedResourcesBasePath: string;
    readonly sharedResources: MashroomPortalAppResources | null | undefined;
    readonly resourcesBasePath: string;
    readonly resources: MashroomPortalAppResources;
    readonly globalLaunchFunction: string;
    readonly lang: string;
    readonly user: MashroomPortalAppUser;
    readonly appConfig: MashroomPluginConfig;
};

export type UserAgent = {
    readonly browser: {
        readonly name:
            | ('Android Browser' | null | undefined)
            | 'Chrome'
            | 'Chromium'
            | 'Edge'
            | 'Firefox'
            | 'IE'
            | 'IEMobile'
            | 'Konqueror'
            | 'Mobile Safari'
            | 'Opera Mini'
            | 'Opera'
            | 'Safari'
            | 'Samsung Browser'
            | 'Tizen Browser'
            | string;
        readonly version: string | null | undefined;
    };
    readonly os: {
        name: string | null | undefined;
    };
};

export type MashroomPortalUser = {
    readonly guest: boolean;
    readonly username?: string;
    readonly displayName?: string;
    readonly roles?: Array<string>;
};

export interface MashroomPortalPageRenderModel {
    readonly portalName: string;
    readonly portalBasePath: string;
    readonly siteBasePath: string;
    readonly apiBasePath: string;
    readonly resourcesBasePath: string | null | undefined;
    readonly site: MashroomPortalSiteLocalized;
    readonly page: MashroomPortalPage & MashroomPortalPageRefLocalized;
    readonly portalResourcesHeader: string;
    readonly portalResourcesFooter: string;
    readonly portalLayout: string;
    readonly lang: string;
    readonly availableLanguages: Readonly<Array<string>>;
    readonly messages: (key: string) => string;
    readonly user: MashroomPortalUser;
    readonly csrfToken: string | null | undefined;
    readonly userAgent: UserAgent;
    readonly lastThemeReloadTs: number;
}

/* Plugins */

export interface MashroomPortalTheme {
    /**
     * Name of the theme
     */
    readonly name: string;

    /**
     * Optional description
     */
    readonly description: string | null | undefined;

    /**
     * Last reload of the theme
     */
    readonly lastReloadTs: number;

    /**
     * Engine name (e.g. 'handlebars')
     */
    readonly engineName: string;

    /**
     * The express template engine instance
     */
    requireEngine(): any;

    /**
     * Resources root path (css and other resources)
     */
    readonly resourcesRootPath: string;

    /**
     * Absolute views path
     */
    readonly viewsPath: string;
}

export interface MashroomPortalLayout {
    /**
     * Name of the layout
     */
    readonly name: string;

    /**
     * Optional description
     */
    readonly description: string | null | undefined;

    /**
     * Last reload of the theme
     */
    readonly lastReloadTs: number;

    /**
     * The layout name
     */
    readonly layoutId: string;

    /**
     * Full (filesystem) path to the layout file
     */
    readonly layoutPath: string;
}

export type MashroomAvailablePortalLayout = {
    readonly name: string;
    readonly description: string | null | undefined;
    readonly lastReloadTs: number;
};

export type MashroomAvailablePortalTheme = {
    readonly name: string;
    readonly description: string | null | undefined;
    readonly lastReloadTs: number;
};

export type MashroomPortalProxyDefinition = {
    readonly targetUri: string;
    readonly sendUserHeaders?: boolean;
    readonly sendPermissionsHeader?: boolean;
    readonly addHeaders?: Record<string, string>;
    readonly restrictToRoles?: Array<string>;
};

export type MashroomPortalProxyDefinitions = {
    [id: string]: MashroomPortalProxyDefinition;
};

export type MashroomPortalAppResources = {
    readonly js: Array<string>;
    readonly css?: Array<string>;
};

export type MashroomPortalRolePermissions = {
    [permission: string]: Array<string>;
};

export type MashroomPortalApp = {
    /**
     * Portal App name
     */
    readonly name: string;

    /**
     * Portal app description
     */
    readonly description: string | null | undefined;

    /**
     * Optional tags
     */
    readonly tags: Array<string>;

    /**
     * An optional internationalized title (will be shown in the header)
     */
    readonly title: I18NString | null | undefined;

    /**
     * The package version
     */
    readonly version: string;

    /**
     * Homepage (package)
     */
    readonly homepage: string | null | undefined;

    /**
     * The author (package)
     */
    readonly author: string | null | undefined;

    /**
     * The license (package)
     */
    readonly license: string | null | undefined;

    /**
     * Portal app category
     */
    readonly category: string | null | undefined;

    /**
     * Any kind of optional meta information
     */
    readonly metaInfo: any | null | undefined;

    /**
     * Last reload of the app
     */
    readonly lastReloadTs: number;

    /**
     * Name of the global launch function to start the app
     */
    readonly globalLaunchFunction: string;

    /**
     * Resources root URI (can be file, http or https)
     */
    readonly resourcesRootUri: string;

    /**
     * Resource to load
     */
    readonly resources: MashroomPortalAppResources;

    /**
     * Shared JS libraries (only loaded once on a page)
     */
    readonly sharedResources: MashroomPortalAppResources | null | undefined;

    /**
     * An optional list of screenshots (relative to resourcesRootUri)
     */
    readonly screenshots: Array<string> | null | undefined;

    /**
     * If no role restrictions were defined via Admin App in the UI only these roles can view the app.
     * If not set every user can load the app.
     */
    readonly defaultRestrictViewToRoles: Array<string> | null | undefined;

    /**
     * A mapping between app specific permissions and existing roles
     */
    readonly rolePermissions: MashroomPortalRolePermissions | null | undefined;

    /**
     * REST proxy definitions
     */
    readonly restProxies: MashroomPortalProxyDefinitions | null | undefined;

    /**
     * The default plugin config
     */
    readonly defaultAppConfig: MashroomPluginConfig;
}

export type MashroomAvailablePortalApp = {
    readonly name: string;
    readonly description: string | null | undefined;
    readonly tags: Array<string>;
    readonly category: string | null | undefined;
    readonly lastReloadTs: number;
};

export type MashroomPortalAppLoadListener = (
    arg0: MashroomPortalLoadedPortalApp,
) => void;

export type MashroomPortalPageEnhancement = {
    /**
     * Enhancer name
     */
    readonly name: string;
    /**
     * Enhancer description
     */
    readonly description: string | undefined | null;
    /**
     * Last reload of the plugin
     */
    readonly lastReloadTs: number;
    /**
     * Resources root URI (can be file, http or https)
     */
    readonly resourcesRootUri: string;
    /**
     * Resources that should be added to portal pages
     */
    readonly pageResources: MashroomPortalPageEnhancementResources;
    /**
     * The "weight" of this plugin, the higher it es the later the resources are added to the page
     */
    readonly order: number;
    /**
     * The actual plugin (optional)
     */
    readonly plugin: MashroomPortalPageEnhancementPlugin | undefined;
}

export type MashroomPortalPageEnhancementResource = {
    readonly path?: string;
    readonly dynamicResource?: string;
    readonly rule: string | undefined | null;
    readonly location: 'header' | 'footer' | undefined | null;
    readonly inline: boolean | string | undefined;
}

export type MashroomPortalPageEnhancementResources = {
    readonly js: Array<MashroomPortalPageEnhancementResource>;
    readonly css: Array<MashroomPortalPageEnhancementResource>;
}

export type MashroomPortalPageEnhancementPlugin = {
    readonly dynamicResources?: {
        readonly [name: string]: (sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, request: Request) => string;
    },
    readonly rules?: {
        readonly [name: string]: (sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, request: Request) => boolean;
    }
};

export type MashroomPortalAppEnhancement = {
    /**
     * Enhancer name
     */
    readonly name: string;
    /**
     * Enhancer description
     */
    readonly description: string | undefined | null;
    /**
     * Custom services that should be added to MashroomPortalClientServices (the third argument of the portal app bootstrap).
     * Can also overwrite an existing one.
     * The value refers to global variable (in window)
     */
    readonly portalCustomClientServices: {
        [customService: string]: string;
    };
    /**
     * The actual plugin
     */
    plugin: MashroomPortalAppEnhancementPlugin
}

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

/* Backend services */

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

/* Frontend services */

export type CreatedResponse = {
    readonly location: string;
};

export interface MashroomRestService {
    get(path: string, extraHeaders?: Record<string, string>): Promise<any>;

    post(path: string, data: any, extraHeaders?: Record<string, string>): Promise<any>;

    put(path: string, data: any, extraHeaders?: Record<string, string>): Promise<void>;

    delete(path: string, extraHeaders?: Record<string, string>): Promise<void>;

    withBasePath(apiBasePath: string): MashroomRestService;
}

export type ModalAppCloseCallback = (
    modalOverlayElem: HTMLElement,
    hideDialog: () => void,
    unloadApp: () => void,
) => void;

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

export type MashroomPortalMessageBusSubscriberCallback = (
    data: any,
    topic: string,
    senderAppId: string | null | undefined,
) => void;

export type MashroomPortalMessageBusInterceptor = (
    data: any,
    topic: string,
    senderAppId: string | null | undefined,
    receiverAppId: string | null | undefined,
    cancelMessage: () => void,
) => any | null | undefined;

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
     * It is also possible to block messages by returning 'undefined' or 'null'.
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

export interface MashroomPortalMasterMessageBus
    extends MashroomPortalMessageBus {
    /**
     * Get an app specific instance.
     * The returned instance will set the senderId on the MashroomPortalMessageBusSubscriberCallback to the given id.
     */
    getAppInstance(appId: string): MashroomPortalMessageBus;

    /**
     * Unsubscribe/Unregister everything from given app (for cleanup after unload)
     */
    unsubscribeEverythingFromApp(appId: string): void;
}

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
     * Generate a URL with the given state encoded into it
     */
    encodeStateIntoUrl(baseUrl: string, state: any,
        additionalQueryParams?: { [key: string]: string; } | null | undefined, hash?: string | null | undefined): string;

    /**
     * Add given key value pair to the session storage
     */
    setSessionStateProperty(key: string, value: any): void;

    /**
     * Add given key value pair to the local storage
     */
    setLocalStoreStateProperty(key: string, value: any): void;
}

export interface MashroomPortalMasterStateService extends MashroomPortalStateService {
    /**
     * Get a state service with a specific prefix for items in the browser storage (scope)
     */
    withKeyPrefix(prefix: string): MashroomPortalStateService;
}

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

export interface MasterMashroomPortalRemoteLogger extends MashroomPortalRemoteLogger {
    /**
     * Send a client error to the server log
     */
    error(msg: string, error?: Error, portalAppName?: string | null | undefined): void;

    /**
     * Send a client warning to the server log
     */
    warn(msg: string, error?: Error, portalAppName?: string | null | undefined): void;

    /**
     * Send a client info to the server log
     */
    info(msg: string, portalAppName?: string | null | undefined): void;

    /**
     * Get an app specific instance.
     * The returned instance will set the portalAppName automatically.
     */
    getAppInstance(portalAppName: string): MashroomPortalRemoteLogger;
}

export type MashroomPortalClientServices = {
    readonly portalAdminService: MashroomPortalAdminService;
    readonly portalAppService: MashroomPortalAppService;
    readonly portalUserService: MashroomPortalUserService;
    readonly portalSiteService: MashroomPortalSiteService;
    readonly messageBus: MashroomPortalMessageBus;
    readonly restService: MashroomRestService;
    readonly stateService: MashroomPortalStateService;
    readonly remoteLogger: MashroomPortalRemoteLogger;
    readonly [customService: string]: any;
};

export type CreateAppWrapper = (
    id: string,
    pluginName: string,
) => {
    portalAppWrapperElement: HTMLDivElement;
    portalAppHostElement: HTMLDivElement;
    portalAppTitleElement: HTMLDivElement;
};

export type CreateLoadingError = (
    id: string,
    pluginName: string,
    title: string | null | undefined,
) => HTMLDivElement;

/* Plugin bootstrap functions */

// remote-portal-app-registry

export interface MashroomRemotePortalAppRegistry {
    readonly portalApps: Readonly<Array<MashroomPortalApp>>;
}

export type MashroomRemotePortalAppRegistryBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomRemotePortalAppRegistry>;

// portal-app

export type MashroomPortalAppLifecycleHooks = {
    /*+
     * Will be called before the host element will be removed from the DOM.
     * Can be used to cleanup (e.g. to unmount a React App).
     */
    readonly willBeRemoved: () => void | Promise<void>;
};

export type MashroomPortalAppPluginBootstrapFunction = (
    portalAppHostElement: HTMLElement,
    portalAppSetup: MashroomPortalAppSetup,
    clientServices: MashroomPortalClientServices,
) =>
    | void
    | MashroomPortalAppLifecycleHooks
    | Promise<void | MashroomPortalAppLifecycleHooks>;

// portal-theme

export type MashroomPortalThemePluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<{
    readonly engineName: string;
    readonly engineFactory: () => any;
}>;

// portal-page-enhancer

export type MashroomPortalPageEnhancementPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder)
    => MashroomPortalPageEnhancementPlugin;

// portal-app-enhancement

export type MashroomPortalAppEnhancementPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder)
    => MashroomPortalAppEnhancementPlugin;
