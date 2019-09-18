// @flow

import type {
    I18NString,
    MashroomPluginContextHolder,
    MashroomPluginConfig,
    ExpressApplication,
    LogLevel
} from '@mashroom/mashroom/type-definitions';

export type MashroomPortalUser = {
    +guest: boolean,
    +username?: string,
    +displayName?: string,
    +roles?: Array<string>
}

export type CreatedResponse = {
    +location: string
}

/* Plugins */

export type MashroomPortalProxyDefinition = {
    +targetUri: string,
    +sendUserHeader?: boolean,
    +sendPermissionsHeader?: boolean,
    +sendRolesHeader?: boolean,
    +addHeaders?: any
}

export type MashroomPortalProxyDefinitions = {
    [id: string]: MashroomPortalProxyDefinition
};

export type MashroomPortalAppResources = {
    +js: Array<string>;
    +css?: Array<string>;
}

export type MashroomPortalRolePermissions = {
    [permission: string]: Array<string>
}

export interface MashroomPortalApp {
    /**
     * Portal App name
     */
    +name: string;
    /**
     * Portal app description
     */
    +description: ?string;
    /**
     * Optional tags
     */
    +tags: Array<string>;
    /**
     * An optional internationalized title (will be shown in the header)
     */
    +title: ?I18NString,
    /**
     * The package version
     */
    +version: string;
    /**
     * Homepage (package)
     */
    +homepage: ?string;
    /**
     * The author (package)
     */
    +author: ?string;
    /**
     * The license (package)
     */
    +license: ?string;
    /**
     * Portal app category
     */
    +category: ?string;
    /**
     * Any kind of optional meta information
     */
    +metaInfo: ?any;
    /**
     * Last reload of the app
     */
    +lastReloadTs: number;
    /**
     * Name of the global launch function to start the app
     */
    +globalLaunchFunction: string;
    /**
     * Resources root URI (can be file, http or https)
     */
    +resourcesRootUri: string;
    /**
     * Resource to load
     */
    +resources: MashroomPortalAppResources;
    /**
     * Shared JS libraries (only loaded once on a page)
     */
    +globalResources: ?MashroomPortalAppResources;
    /**
     * An optional list of screenshots (relative to resourcesRootUri)
     */
    +screenshots: ?Array<string>,
    /**
     * If no restrictions are defined for this app use this array as minimal required roles for the View permission
     */
    +defaultRestrictedToRoles: ?Array<string>;
    /**
     * A mapping between app specific permissions and existing roles
     */
    +rolePermissions: ?MashroomPortalRolePermissions;
    /**
     * REST proxy definitions
     */
    +restProxies: ?MashroomPortalProxyDefinitions;
    /**
     * The default plugin config
     */
    +defaultAppConfig: MashroomPluginConfig;
}

export type MashroomAvailablePortalApp = {
    +name: string;
    +description: ?string;
    +tags: Array<string>,
    +category: ?string;
    +lastReloadTs: number;
}

export interface MashroomPortalTheme {
    /**
     * Name of the theme
     */
    +name: string;
    /**
     * Optional description
     */
    +description: ?string;
    /**
     * Last reload of the theme
     */
    +lastReloadTs: number;
    /**
     * Engine name (e.g. 'handlebars')
     */
    +engineName: string;
    /**
     * The express template engine instance
     */
    requireEngine(): any;
    /**
     * Resources root path (css and other resources)
     */
    +resourcesRootPath: string;
    /**
     * Absolute views path
     */
    +viewsPath: string;
}

export type MashroomAvailablePortalTheme = {
    +name: string;
    +description: ?string;
    +lastReloadTs: number;
}

export interface MashroomPortalLayout {
    /**
     * Name of the layout
     */
    +name: string;
    /**
     * Optional description
     */
    +description: ?string;
    /**
     * Last reload of the theme
     */
    +lastReloadTs: number;
    /**
     * The layout name
     */
    +layoutId: string;
    /**
     * Full (filesystem) path to the layout file
     */
    +layoutPath: string;
}

export type MashroomAvailablePortalLayout = {
    +name: string;
    +description: ?string;
    +lastReloadTs: number;
}

export interface MashroomRemotePortalAppRegistry {
    +portalApps: Array<MashroomPortalApp>;
}

export interface MashroomRemotePortalAppRegistryHolder {
    +name: string;
    +priority: number;
    +registry: MashroomRemotePortalAppRegistry;
}

export interface MashroomPortalPluginRegistry {
    +portalApps: Array<MashroomPortalApp>;
    +themes: Array<MashroomPortalTheme>;
    +layouts: Array<MashroomPortalLayout>;
    registerPortalApp(portalApp: MashroomPortalApp): void;
    unregisterPortalApp(pluginName: string): void;
    registerTheme(theme: MashroomPortalTheme): void;
    unregisterTheme(themeName: string): void;
    registerLayout(layout: MashroomPortalLayout): void;
    unregisterLayout(layoutName: string): void;
    registerRemotePortalAppRegistry(registry: MashroomRemotePortalAppRegistryHolder): void;
    unregisterRemotePortalAppRegistry(name: string): void;
}

/* Model */

export type MashroomPortalSite = {
    siteId: string,
    +title: I18NString,
    +path: string,
    +virtualHosts?: Array<string>,
    +defaultTheme?: string,
    +defaultLayout?: string,
    +pages: Array<MashroomPortalPageRef>
}

export type MashroomPortalSiteLocalized = {
    +siteId: string,
    +title: string,
    +path: string,
    +pages: Array<MashroomPortalPageRefLocalized>
}

export type MashroomPortalSiteLinkLocalized = {
    +siteId: string,
    +title: string,
    +url: string
}

export type MashroomPortalPageRef = {
    +pageId: string,
    +title: I18NString,
    +friendlyUrl: string,
    +hidden?: boolean,
    subPages?: Array<MashroomPortalPageRef>
}

export type MashroomPortalPageRefLocalized = {
    +pageId: string,
    +title: string,
    +friendlyUrl: string,
    +hidden?: boolean,
    subPages?: Array<MashroomPortalPageRefLocalized>
}

export type MashroomPortalPage = {
    pageId: string,
    +description?: string,
    +keywords?: string,
    +theme?: string,
    +layout?: string,
    +extraCss?: string,
    portalApps?: MashroomPortalApps
}

export type MashroomPortalApps = {
    [areaId: string]: Array<MashroomPortalAppInstanceRef>
}

export type MashroomPortalAppInstance = {
    +pluginName: string,
    +instanceId: ?string,
    +appConfig?: {
        [string]: any
    }
}

export type MashroomPortalAppInstanceRef = {|
    +pluginName: string,
    +instanceId: ?string
|}

export type MashroomPagePortalAppInstance = {|
    +pluginName: string,
    +instanceId: ?string,
    +areaId: string,
    +position: number
|}

export type MashroomCreatePagePortalAppInstance = {|
    +pluginName: string,
    +areaId: string,
    +position?: number,
    +appConfig?: {
        [string]: any
    }
|}

export type MashroomUpdatePagePortalAppInstance = {
    areaId?: string,
    position?: number,
    appConfig?: {
        [string]: any
    }
}

/* Backend */

export type UserAgent = {
    +browser: {
        +name: ? 'Android Browser' | 'Chrome' | 'Chromium' | 'Edge' | 'Firefox' | 'IE' | 'IEMobile' | 'Konqueror' | 'Mobile Safari' | 'Opera Mini' | 'Opera' | 'Safari' | 'Samsung Browser' | 'Tizen Browser' | string,
            +version: ?string
    },
    +os: {
        name: ?string
    }
}

export interface MashroomPortalPageRenderModel {
    +portalName: string,
    +portalBasePath: string,
    +siteBasePath: string,
    +resourcesBasePath: ?string,
    +site: MashroomPortalSiteLocalized,
    +page: MashroomPortalPage & MashroomPortalPageRefLocalized,
    +portalResourcesHeader: string,
    +portalResourcesFooter: string,
    +portalLayout: string,
    +lang: string,
    +availableLanguages: Array<string>,
    +messages: (key: string) => string,
    +user: MashroomPortalUser,
    +csrfToken: ?string,
    +userAgent: UserAgent
}

export type MashroomPortalPluginConfig = {
    +path: string,
    +adminApp: string,
    +defaultTheme: string,
    +warnBeforeAuthenticationExpiresSec: number,
    +autoExtendAuthentication: boolean,
}

export type MashroomPortalContext = {
    +startTs: number,
    +pluginRegistry: MashroomPortalPluginRegistry,
    +portalWebapp: ExpressApplication,
    +portalPluginConfig: MashroomPortalPluginConfig,
}

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

export type ClientLogMessage = {|
    level: LogLevel,
    portalAppName?: ?string,
    message: string
|}

export type RoleDefinition = {
    id: string,
    description?: string
}

/* Frontend */

export type MashroomRestProxyPaths = {
    [id: string]: string
}

export type MashroomPortalAppUserPermissions = {
    [permission: string]: boolean
}

export type MashroomPortalAppUser = {
    +guest: boolean,
    +username?: string,
    +displayName?: string,
    +permissions: MashroomPortalAppUserPermissions
}

export type MashroomPortalAppSetup = {
    +pluginName: string,
    +title: ?string,
    +version: string,
    +instanceId: ?string,
    +lastReloadTs: number,
    +restProxyPaths: MashroomRestProxyPaths,
    +resourcesBasePath: string,
    +globalResourcesBasePath: string,
    +resources: MashroomPortalAppResources,
    +globalLaunchFunction: string,
    +lang: string,
    +user: MashroomPortalAppUser,
    +appConfig: MashroomPluginConfig
}

export type CreateAppWrapper = (id: string, pluginName: string) => {
    portalAppWrapperElement: HTMLDivElement,
    portalAppHostElement: HTMLDivElement,
    portalAppTitleElement: HTMLDivElement,
}
export type CreateLoadingError = (id: string, pluginName: string, title: ?string) => HTMLDivElement;

export type MashroomPortalLoadedPortalApp = {
    +id: string,
    +pluginName: string,
    +title: ?string,
    +version: ?string,
    +instanceId: ?string,
    +portalAppAreaId: string,
    +portalAppWrapperElement: HTMLDivElement,
    +portalAppHostElement: HTMLDivElement,
    +portalAppTitleElement: HTMLDivElement,
    +appConfig: any,
    +error: boolean
}

export type MashroomPortalAppLoadListener = (MashroomPortalLoadedPortalApp) => void;

export interface MashroomRestService {
    get(path: string, extraHeaders?: {}): Promise<any>;
    post(path: string, data: any, extraHeaders?: {}): Promise<any>;
    put(path: string, data: any, extraHeaders?: {}): Promise<void>;
    delete(path: string, extraHeaders?: {}): Promise<void>;
    withBasePath(apiBasePath: string): MashroomRestService;
}

export type ModalAppCloseCallback = (modalOverlayElem: HTMLElement, hideDialog: () => void, unloadApp: () => void) => void;

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

    /**
     * Load the setup for given app/plugin name on the current page
     */
    loadAppSetup(pluginName: string, instanceId: ?string): Promise<MashroomPortalAppSetup>;

    +loadedPortalApps: Array<MashroomPortalLoadedPortalApp>;
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
    getAuthenticationExpiration(): Promise<?number>;
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

export type MashroomPortalMessageBusSubscriberCallback = (data: any, topic: string, senderAppId: ?string) => void;
export type MashroomPortalMessageBusInterceptor = (data: any, topic: string, senderAppId: ?string, receiverAppId: ?string) => ?any;

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
     * Get an app specific instance.
     * The returned instance will set the senderId on the MashroomPortalMessageBusSubscriberCallback to the given id.
     */
    getAppInstance(appId: string): MashroomPortalMessageBus;

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

export interface MashroomPortalRemoteLogger {
    /**
     * Send a client error to the server log
     */
    error(msg: string, error?: Error, portalAppName: ?string): void;
    /**
     * Send a client warning to the server log
     */
    warn(msg: string, error?: Error, portalAppName: ?string): void;

    /**
     * Get an app specific instance.
     * The returned instance will set the portalAppName automatically.
     */
    getAppInstance(portalAppName: string): MashroomPortalRemoteLogger;
}

export type MashroomPortalClientServices = {
    +portalAdminService: MashroomPortalAdminService,
    +portalAppService: MashroomPortalAppService,
    +portalUserService: MashroomPortalUserService,
    +portalSiteService: MashroomPortalSiteService,
    +messageBus: MashroomPortalMessageBus,
    +restService: MashroomRestService,
    +stateService: MashroomPortalStateService,
    +remoteLogger: MashroomPortalRemoteLogger
}

/* Plugin bootstrap functions */

export type MashroomPortalThemePluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<{
    engineName: string,
    engineFactory: () => any
}>;

export type MashroomRemotePortalAppRegistryBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomRemotePortalAppRegistry>;

export type MashroomPortalAppLifecycleHooks = {
    /*+
     * Will be called before the host element will be removed from the DOM.
     * Can be used to cleanup (e.g. to unmount a React App).
     */
    willBeRemoved: () => void | Promise<void>;
}

export type MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement: HTMLElement, portalAppSetup: MashroomPortalAppSetup, clientServices: MashroomPortalClientServices)
    => void | MashroomPortalAppLifecycleHooks | Promise<void> | Promise<MashroomPortalAppLifecycleHooks>;

