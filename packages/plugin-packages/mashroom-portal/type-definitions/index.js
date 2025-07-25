// @flow

import type {I18NString, MashroomPluginConfig, MashroomPluginContextHolder, ExpressRequest} from "@mashroom/mashroom/type-definitions";

/* Model */

export type MashroomPortalSite = {
    +siteId: string,
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
    +path: string,
    +url: string
}

export type MashroomPortalPageRef = {
    +pageId: string,
    +title: I18NString,
    +friendlyUrl: string,
    +clientSideRouting?: boolean,
    +hidden?: boolean,
    +subPages?: Array<MashroomPortalPageRef>
}

export type MashroomPortalPageRefLocalized = {
    +pageId: string,
    +title: string,
    +friendlyUrl: string,
    +clientSideRouting?: boolean;
    +hidden?: boolean,
    +subPages?: Array<MashroomPortalPageRefLocalized>
}

export type MashroomPortalPage = {
    +pageId: string,
    +description?: string,
    +keywords?: string,
    +theme?: string,
    +layout?: string,
    +extraCss?: string,
    +portalApps?: MashroomPortalApps
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

export type RoleDefinition = {
    +id: string,
    +description?: string
}

export type MashroomPortalLoadedPortalApp = {
    +id: string,
    +pluginName: string,
    +title: ?string,
    +version: ?string,
    +instanceId: ?string,
    +portalAppAreaId: string,
    +portalAppWrapperElement: HTMLElement,
    +portalAppHostElement: HTMLElement,
    +portalAppTitleElement: ?HTMLElement,
    +appConfig: any,
    +editorConfig: ?MashroomPortalAppConfigEditor,
    +updateAppConfig: ?(appConfig: MashroomPluginConfig) => void,
    +error: boolean,
    +errorPluginMissing: boolean,
}

export type MashroomPortalLoadedPortalAppStats = {
    +resources: number;
    +totalSize?: number;
    +totalSizeHumanReadable?: string;
}

export type MashroomPortalProxyPaths = {
    __baseUrl: string;
    [id: string]: string;
}

export type MashroomPortalAppUser = {
    +guest: boolean,
    +username: string,
    +displayName: string,
    +email: ?string;
    +permissions: MashroomPortalAppUserPermissions,
    +[customProp: string]: any,
}

export type MashroomPortalAppUserPermissions = {
    +[permission: string]: boolean
}

/**
 * This will be injected as "editorTarget" to the appConfig of config editors
 */
export type MashroomPortalConfigEditorTarget = {
    +appId: string,
    +pluginName: string,
    +appConfig: MashroomPluginConfig,
    +portalAppWrapperElement: HTMLElement;
    updateAppConfig: (appConfig: MashroomPluginConfig) => void,
    close: () => void,
}

export type MashroomPortalAppSetup = {
    +appId: string;
    +pluginName: string,
    +pluginMissing?: boolean,
    +title: ?string,
    +version: string,
    +instanceId: ?string,
    +lastReloadTs: number,
    +serverSideRendered: boolean;
    +versionHash: string,
    +proxyPaths: MashroomPortalProxyPaths,
    // @deprecated Use proxyPaths
    +restProxyPaths: MashroomPortalProxyPaths,
    +sharedResourcesBasePath: string,
    +sharedResources: ?MashroomPortalAppResources,
    +resourcesBasePath: string,
    +resources: MashroomPortalAppResources,
    +globalLaunchFunction: string,
    +lang: string,
    +user: MashroomPortalAppUser,
    +appConfig: MashroomPluginConfig,
    +editorConfig: ?MashroomPortalAppConfigEditor,
}

export type UserAgent = {
    +browser: {
        +name: ? 'Android Browser' | 'Chrome' | 'Chromium' | 'Edge' | 'Firefox' | 'IE' | 'IEMobile' | 'Konqueror' | 'Mobile Safari' | 'Opera Mini' | 'Opera' | 'Safari' | 'Samsung Browser' | 'Tizen Browser' | string,
        +version: ?string
    },
    +os: {
        name: ?string
    }
}

export type MashroomPortalUser = {
    +guest: boolean,
    +admin: boolean,
    +username: string,
    +displayName: string,
    +email?: ?string,
    +pictureUrl?: ?string,
    +extraData?: ?{ [string]: any },
    +roles?: Array<string>,
}

export type MashroomPortalPageContent = {
    +fullPageLoadRequired: ?boolean;
    +pageContent: string;
    +evalScript: string;
}

export type MashroomPortalPageRenderModel = {
    +portalName: string,
    +siteBasePath: string,
    +apiBasePath: string,
    +resourcesBasePath: ?string,
    +adminApp: ?string;
    +site: MashroomPortalSiteLocalized,
    +page: MashroomPortalPage & MashroomPortalPageRefLocalized,
    +portalResourcesHeader: string,
    +portalResourcesFooter: string,
    +pageContent: string;
    // @Deprecated, use pageContent
    +portalLayout: string,
    +lang: string,
    +availableLanguages: Array<string>,
    +messages: (key: string) => string,
    +user: MashroomPortalUser,
    +csrfToken: ?string,
    +userAgent: UserAgent,
    +lastThemeReloadTs: number,
    +themeVersionHash: string,
}

export type MashroomPortalAppWrapperRenderModel = {
    +appId: string,
    +pluginName: string,
    +safePluginName: string,
    +title: string,
    +appHtml: ?string,
}

export type MashroomPortalAppErrorRenderModel = {
    +appId: string,
    +pluginName: string,
    +safePluginName: string,
    +title: string,
    +errorMessage: ?string,
    +messages: (key: string) => string,
}

/* Plugins */

export type ExpressTemplateEngine = (path: string, options: any, callback: (e: any, rendered?: string) => void) => void;

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
     * Version of the theme
     */
    +version: string;
    /**
     * Last reload of the theme
     */
    +lastReloadTs: number;
    /**
     * Engine name, basically the template extension (e.g. 'handlebars')
     */
    +engineName: string;

    /**
     * The express template engine instance if not handled automatically (like pug)
     */
    requireEngine(): ExpressTemplateEngine;

    /**
     * Resources root path (css and other resources)
     */
    +resourcesRootPath: string;
    /**
     * Absolute views path
     */
    +viewsPath: string;
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

export type MashroomAvailablePortalTheme = {
    +name: string;
    +description: ?string;
    +lastReloadTs: number;
}

export type MashroomPortalProxyDefinition = {
    +targetUri: string,
    +sendPermissionsHeader?: boolean,
    +restrictToRoles?: Array<string>,
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

export type MashroomPortalAppCaching = {
    +ssrHtml: 'never' | 'same-config' | 'same-config-and-user';
}

export type MashroomPortalAppConfigEditor = {
    +editorPortalApp: string,
    +position: ?('in-place' | 'sidebar'),
    +appConfig: ?any,
}

export type MashroomPortalApp = {
    /**
     * Portal App name
     */
    +name: string,

    /**
     * Optional tags
     */
    +tags: Array<string>,

    /**
     * Any kind of optional meta information
     */
    +metaInfo: ?any,

    /**
     * Portal App title (will be shown in the header)
     */
    +title: ?I18NString,

    /**
     * Portal App description
     */
    +description: ?I18NString,

    /**
     * The App version
     */
    +version: string,

    /**
     * Homepage (package)
     */
    +homepage: ?string,

    /**
     * The author (package)
     */
    +author: ?string,

    /**
     * The license (package)
     */
    +license: ?string,

    /**
     * Portal app category
     */
    +category: ?string,

    /**
     * Last reload of the app
     */
    +lastReloadTs: number;

    /**
     * Resource to load
     */
    +resources: MashroomPortalAppResources,

    /**
     * Shared JS libraries (only loaded once on a page)
     */
    +sharedResources: ?MashroomPortalAppResources,

    /**
     * An optional list of screenshots (relative to resourcesRootUri)
     */
    +screenshots: ?Array<string>,

    /**
     * Defines if the App is locally deployed within Mashroom Server or on a remote server
     */
    +remoteApp: boolean,

    /**
     * Name of client-side bootstrap function to start or hydrate the App
     * The signature must be compatible to MashroomPortalAppPluginBootstrapFunction
     */
    +clientBootstrap: string,

    /**
     * Optional SSR bootstrap script that delivers the initial HTML.
     * Needs to export a function compatible to MashroomPortalAppPluginSSRBootstrapFunction.
     * This will only be used if remoteApp is false.
     */
    +ssrBootstrap: ?string,

    /**
     * Optional SSR route that delivers the initial HTML.
     * The route will receive a POST with a JSON body with a "portalAppSetup" property.
     * This will only be used if remoteApp is true.
     */
    +ssrInitialHtmlPath: ?string,

    /**
     * Resources root URI (local path if remoteApp false, otherwise an HTTP or HTTPS url)
     */
    +resourcesRootUri: string,

    /**
     * Optional caching information
     */
    +caching: ?MashroomPortalAppCaching,

    /**
     * Optional definition of a "editor" App that should be used to edit the appConfig
     * of this one. Instead of the default one which is basically just a raw JSON editor.
     */
    +editorConfig: ?MashroomPortalAppConfigEditor,

    /**
     * If no role restrictions were defined via Admin App in the UI only these roles can view the app.
     * If not set every user can load the app.
     */
    +defaultRestrictViewToRoles: ?Array<string>,

    /**
     * A mapping between app specific permissions and existing roles
     */
    +rolePermissions: ?MashroomPortalRolePermissions,

    /**
     * Proxy definitions
     */
    +proxies: ?MashroomPortalProxyDefinitions,

    /**
     * The default plugin config
     */
    +defaultAppConfig: MashroomPluginConfig;
}

export type MashroomAvailablePortalApp = {
    +name: string;
    +version: string;
    +title: ?string;
    +category: ?string;
    +description: ?string;
    +tags: Array<string>,
    +homepage: ?string;
    +screenshots: Array<string>;
    +requiredRoles: Array<string>;
    +metaInfo: ?any;
    +lastReloadTs: number;
}

export type MashroomUnavailablePortalApp = {
    +available: false;
    +name: string;
    +version: string;
    +title: ?string;
    +requiredRoles: Array<string>;
    +lastReloadTs: number;
    +unavailableReason: 'forbidden';
}

export type MashroomKnownPortalApp = MashroomAvailablePortalApp | MashroomUnavailablePortalApp;

export type MashroomPortalAppLoadListener = (MashroomPortalLoadedPortalApp) => void;

export type MashroomPortalPageEnhancement = {
    /**
     * Enhancer name
     */
    +name: string;
    /**
     * Enhancer description
     */
    +description: ?string;
    /**
     * Enhancer version
     */
    +version: string;
    /**
     * Last reload of the plugin
     */
    +lastReloadTs: number;
    /**
     * Resources root URI (can be file, http or https)
     */
    +resourcesRootUri: string;
    /**
     * Resources that should be added to portal pages
     */
    +pageResources: MashroomPortalPageEnhancementResources;
    /**
     * The "weight" of this plugin, the higher it es the later the resources are added to the page
     */
    +order: number;
    /**
     * The actual plugin (optional)
     */
    +plugin: ?MashroomPortalPageEnhancementPlugin
}

export type MashroomPortalPageEnhancementResource = {
    +path?: string;
    +dynamicResource?: string;
    +rule: ?string;
    +location: ?'header' | 'footer';
    +inline: ?boolean;
}

export type MashroomPortalPageEnhancementResources = {
    +js: Array<MashroomPortalPageEnhancementResource>;
    +css: Array<MashroomPortalPageEnhancementResource>;
}

export type MashroomPortalPageEnhancementPlugin = {
    +dynamicResources?: {
        +[name: string]: (sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, request: ExpressRequest) => string;
    },
    +rules?: {
        +[name: string]: (sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, request: ExpressRequest) => boolean;
    }
};

export type MashroomPortalAppEnhancement = {
    /**
     * Enhancer name
     */
    +name: string;
    /**
     * Enhancer description
     */
    +description: ?string;
    /**
     * Custom services that should be added to MashroomPortalClientServices (the third argument of the portal app bootstrap).
     * Can also overwrite an existing one.
     * The value refers to global variable (in window)
     */
    +portalCustomClientServices: {
        [customService: string]: string;
    };
    /**
     * The actual plugin
     */
    +plugin: ?MashroomPortalAppEnhancementPlugin;
}

export interface MashroomPortalAppEnhancementPlugin {
    /**
     * Enhance the portalAppSetup object passed as the first argument (if necessary)
     */
    enhancePortalAppSetup: (portalAppSetup: MashroomPortalAppSetup, portalApp: MashroomPortalApp, request: ExpressRequest) => Promise<MashroomPortalAppSetup>;
}

/* Backend services */

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
     * Get all registered page enhancement plugins
     */
    getPortalPageEnhancements(): Array<MashroomPortalPageEnhancement>;

    /**
     * Get all registered app enhancement plugins
     */
    getPortalAppEnhancements(): Array<MashroomPortalAppEnhancement>;

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
    deleteSite(req: ExpressRequest, siteId: string): Promise<void>;

    /**
     * Get page with given id
     */
    getPage(pageId: string): Promise<?MashroomPortalPage>;

    /**
     * Find the page ref within a site with given friendly URL
     */
    findPageRefByFriendlyUrl(site: MashroomPortalSite, friendlyUrl: string): Promise<?MashroomPortalPageRef>;

    /**
     * Find the page ref within a site by the given pageId
     */
    findPageRefByPageId(site: MashroomPortalSite, pageId: string): Promise<?MashroomPortalPageRef>;

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
    deletePage(req: ExpressRequest, pageId: string): Promise<void>;

    /**
     * Get Portal App instance
     */
    getPortalAppInstance(pluginName: string, instanceId: ?string): Promise<?MashroomPortalAppInstance>;

    /**
     * Insert a new Portal App instance
     */
    insertPortalAppInstance(portalAppInstance: MashroomPortalAppInstance): Promise<void>;

    /**
     * Update given Portal App instance
     */
    updatePortalAppInstance(portalAppInstance: MashroomPortalAppInstance): Promise<void>;

    /**
     * Delete given Portal App instance
     */
    deletePortalAppInstance(req: ExpressRequest, pluginName: string, instanceId: ?string): Promise<void>;
}

/* Frontend services */

export type AppSearchFilter = {
    // Query (searches in name and title)
    +q?: string;
    +includeNotPermitted?: boolean;
};

export type ModalAppCloseCallback = () => void;

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
     * Load a Portal App into given host element at given position (or at the end if position is not set)
     *
     * The returned promise will always resolve! If there was a loading error the MashroomPortalLoadedPortalApp.error property will be true.
     */
    loadApp(appAreaId: string, pluginName: string, instanceId: ?string, position?: ?number, overrideAppConfig?: ?Object): Promise<MashroomPortalLoadedPortalApp>;

    /**
     * Load a Portal App into a modal overlay.
     *
     * The returned promise will always resolve! If there was a loading error the MashroomPortalLoadedPortalApp.error property will be true.
     */
    loadAppModal(pluginName: string, title?: ?string, overrideAppConfig?: ?Object, onClose?: ?ModalAppCloseCallback): Promise<MashroomPortalLoadedPortalApp>;

    /**
     * Reload given Portal App.
     *
     * The returned promise will always resolve!
     * If there was a loading error the MashroomPortalLoadedPortalApp.error property will be true.
     */
    reloadApp(id: string, overrideAppConfig?: ?Object): Promise<MashroomPortalLoadedPortalApp>;

    /**
     * Unload given Portal App.
     */
    unloadApp(id: string): Promise<void>;

    /**
     * Move a loaded App to another area (to another host element within the DOM)
     */
    moveApp(id: string, newAppAreaId: string, newPosition?: number): void;

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
     * Add a listener for unload events (fired before an App will be detached from the page)
     */
    registerAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener): void;

    /**
     * Remove a listener for unload events
     */
    unregisterAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener): void;

    /**
     * Load the setup for given App/plugin name on the current page
     */
    loadAppSetup(pluginName: string, instanceId: ?string): Promise<MashroomPortalAppSetup>;

    /**
     * Get some stats about a loaded App
     */
    getAppStats(pluginName: string): ?MashroomPortalLoadedPortalAppStats;

    /**
     * Check if some loaded Portal Apps have been updated (and have a different version on the server).
     * This can be used to check if the user should refresh the current page.
     *
     * Returns the list of upgraded Apps.
     */
    checkLoadedPortalAppsUpdated(): Promise<Array<string>>;

    /**
     * Prefetch resources of given App/plugin. This is useful if you know which apps you will have to load
     * in the future and want to minimize the loading time.
     */
    prefetchResources(pluginName: string): Promise<void>;

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
    getPageId(pageUrl: string): Promise<?string>;
    /**
     * Get the content for given pageId.
     * It also calculates if the correct theme and all necessary page enhancements for the requested page
     * are already loaded. Otherwise, fullPageLoadRequired is going to be true and no content returned.
     */
    getPageContent(pageId: string): Promise<MashroomPortalPageContent>;
}

export interface MashroomPortalUserService {
    /**
     * Get the authentication expiration time in unix time ms.
     * Returns null if the check fails and "0" if the check returns 403.
     */
    getAuthenticationExpiration(): Promise<?number>;

    /**
     * Get the unix ms left until authentication expiration.
     * Returns null if the check fails and "0" if the check returns 403.
     */
    getTimeToAuthenticationExpiration(): Promise<?number>;

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
export type MashroomPortalMessageBusInterceptor = (data: any, topic: string, senderAppId: ?string, receiverAppId: ?string, cancelMessage: () => void) => ?any;

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
     * Get the private user topic for the given user or the currently authenticated user if no argument given.
     * You can subscribe to "sub" topics as well, e.g. <private_topic>/foo
     */
    getRemoteUserPrivateTopic(username?: string): ?string;

    /**
     * The prefix for remote topics
     */
    getRemotePrefix(): string;

    /**
     * Register a message interceptor.
     * An interceptor can be useful for debugging or to manipulate the messages.
     * It can change the data of an event by return a different value or block messages
     * by calling cancelMessage() from the interceptor arguments.
     */
    registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor): void;

    /**
     * Unregister a message interceptor.
     */
    unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor): void;
}

export interface MashroomPortalMasterMessageBus extends MashroomPortalMessageBus {
    /**
     * Get an App specific instance.
     * The returned instance will set the senderId on the MashroomPortalMessageBusSubscriberCallback to the given id.
     */
    getAppInstance(appId: string): MashroomPortalMessageBus;

    /**
     * Unsubscribe/Unregister everything from a given App (for cleanup after unload)
     */
    unsubscribeEverythingFromApp(appId: string): Promise<void>;
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
    error(msg: string, error?: Error, portalAppName: ?string): void;

    /**
     * Send a client warning to the server log
     */
    warn(msg: string, error?: Error, portalAppName: ?string): void;

    /**
     * Send a client info to the server log
     */
    info(msg: string, portalAppName: ?string): void;

    /**
     * Get an app specific instance.
     * The returned instance will set the portalAppName automatically.
     */
    getAppInstance(portalAppName: string): MashroomPortalRemoteLogger;
}

export type MashroomPortalClientServices = {
    +messageBus: MashroomPortalMessageBus,
    +stateService: MashroomPortalStateService,
    +remoteLogger: MashroomPortalRemoteLogger,
    +portalAdminService: MashroomPortalAdminService,
    +portalAppService: MashroomPortalAppService,
    +portalUserService: MashroomPortalUserService,
    +portalPageService: MashroomPortalPageService,
    +portalSiteService: MashroomPortalSiteService,
    +[customService: string]: any
}

/* Plugin bootstrap functions */

// portal-app-registry

export interface MashroomPortalAppRegistry {
    +portalApps: Array<MashroomPortalApp>;
}

export type MashroomPortalAppRegistryBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomPortalAppRegistry>;

// portal-app

export type MashroomPortalAppLifecycleHooks = {
    /**
     * Will be called before the host element will be removed from the DOM.
     * Can be used to clean up (e.g. to unmount a React App).
     */
    +willBeRemoved?: () => void | Promise<void>;
    /**
     * Dynamically update the appConfig.
     * If present this will be used to update the appConfig instead of restarting the whole App.
     */
    +updateAppConfig?: (appConfig: MashroomPluginConfig) => void;
}

export type MashroomPortalAppSSRRemoteRequest = {
    +originalRequest: {
        +path: string,
        +queryParameters: any,
    },
    +portalAppSetup: MashroomPortalAppSetup,
}

export type MashroomPortalAppSSRResultEmbeddedApp = {
    /**
     * The area Id (host ID) the embedded Portal App should be integrated into
     */
    +appAreaId: string,
    /**
     * The Portal App name
     */
    +pluginName: string,
    /**
     * The Portal App config
     */
    +appConfig?: ?MashroomPluginConfig,
}

export type MashroomPortalAppSSRResultEmbeddedApps = Array<MashroomPortalAppSSRResultEmbeddedApp>;

export type MashroomPortalAppSSRResult = {
    +html: string;
    +injectHeadScript?: string;
    +embeddedApps?: MashroomPortalAppSSRResultEmbeddedApps;
}

export type MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement: HTMLElement, portalAppSetup: MashroomPortalAppSetup, clientServices: MashroomPortalClientServices)
    => void | MashroomPortalAppLifecycleHooks | Promise<void> | Promise<MashroomPortalAppLifecycleHooks>;

export type MashroomPortalAppPluginSSRBootstrapFunction = (portalAppSetup: MashroomPortalAppSetup, req: ExpressRequest) => Promise<string | MashroomPortalAppSSRResult>;

// portal-theme

export type MashroomPortalThemePluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<{
    +engineName: string,
    +engineFactory: () => ExpressTemplateEngine
}>;

// portal-page-enhancer

export type MashroomPortalPageEnhancementPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder)
    => MashroomPortalPageEnhancementPlugin;

// portal-app-enhancement

export type MashroomPortalAppEnhancementPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder)
    => MashroomPortalAppEnhancementPlugin;
