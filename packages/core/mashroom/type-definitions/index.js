// @flow

import type {Router, $Request, $Response, $Application, NextFunction} from 'express';

export type HttpServerRequest = $Subtype<http$IncomingMessage<>> & {
    pluginContext: MashroomPluginContext
};
export type ExpressRequest = $Subtype<$Request> & {
    pluginContext: MashroomPluginContext
};
export type ExpressResponse = $Response;
export type ExpressNextFunction = NextFunction;
export type ExpressApplication = $Application;
export type ExpressMiddleware = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => mixed;
export type ExpressErrorHandler = (error: Error, req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => mixed;
export type ExpressRouter = Router;
export type ExpressRequestHandler = ExpressApplication | ExpressRouter | ExpressMiddleware | ExpressErrorHandler;

export type PluginPackageFolder = {
    +path: string,
    +watch?: boolean,
    +devMode?: boolean,
}

export type I18NString = string | {
    [lang: string]: string
};

export type MashroomServerInfo = {
    +version: string
}

/**
 * Mashroom server config
 */
export type MashroomServerConfig = {
    +name: string,
    +port: number,
    +xPowerByHeader: ?string,
    +serverRootFolder: string,
    +tmpFolder: string,
    +pluginPackageFolders: Array<PluginPackageFolder>,
    +ignorePlugins: Array<string>,
    +indexPage: string,
    [key: string]: any
}

export interface GlobalNodeErrorHandler {
    install(): void;
    uninstall(): void;
}

export interface MashroomServerConfigHolder {
    getConfig(): MashroomServerConfig;
}

/**
 * Mashroom server config loader inteface
 */
export interface MashroomServerConfigLoader {
    load(path: string): MashroomServerConfigHolder
}

/**
 * Generic event emitter (under the hood node's EventEmitter will be used)
 */
export interface MashroomEventEmitter<N, E> {
    on(eventName: N, listener: E => void): void;
    removeListener(eventName: N, listener: E => void): void;
}

/**
 * Mashroom logger interface
 */
export interface MashroomLogger {
    debug(msg: string, ...args: any[]): void;
    info(msg: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
    addContext(context: {}): void;
    withContext(context: {}): MashroomLogger;
}

export interface MashroomLoggerContext {
    add(context: {}): void;
    get(): {};
    clone(): MashroomLoggerContext;
}

export type MashroomLoggerFactory = {
    (category: string): MashroomLogger;
    bindToContext(context: MashroomLoggerContext): MashroomLoggerFactory;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface MashroomLoggerDelegate {
    init(serverRootPath: string): Promise<void>;
    log(category: string, level: LogLevel, context: ?{}, message: string, args: ?any[]): void;
}

export type MashroomPluginPackagePath = string;
export type MashroomPluginPackageScannerEventName = 'packageAdded' | 'packageUpdated' | 'packageRemoved';
export type MashroomPluginPackageScannerEvent = MashroomPluginPackagePath;

/**
 * Mashroom plugin package scanner interface
 */
export interface MashroomPluginPackageScanner extends MashroomEventEmitter<MashroomPluginPackageScannerEventName, MashroomPluginPackageScannerEvent> {
    /**
     * Plugin root folders
     */
    +pluginPackageFolders: Array<string>;
    /**
     * The currently valid plugin package paths
     */
    +pluginPackagePaths: Array<MashroomPluginPackagePath>;
    /**
     * Start scan
     */
    start(): Promise<void>;
    /**
     * Stop scan
     */
    stop(): Promise<void>;
}

export type MashroomPluginPackageBuilderEventName = 'build-finished';
export type MashroomPluginPackageBuilderEvent = {|
    +pluginPackageName: string,
    +success: boolean,
    +errorMessage?: string
|}

/**
 * Mashroom plugin package scanner interface
 */
export interface MashroomPluginPackageBuilder extends MashroomEventEmitter<MashroomPluginPackageBuilderEventName, MashroomPluginPackageBuilderEvent> {

    /**
     * Add given plugin package to build queue
     *
     * @param pluginPackageName
     * @param pluginPackagePath
     * @param buildScript
     * @param lastSourceUpdateTimestamp
     */
    addToBuildQueue(pluginPackageName: string, pluginPackagePath: string, buildScript: ?string, lastSourceUpdateTimestamp?: number): void;

    /**
     * Remove from build queue (if present)
     *
     * @param pluginPackageName
     */
    removeFromBuildQueue(pluginPackageName: string): void;

    /**
     * Stop processing build queue
     */
    stopProcessing(): void;
}

/**
 * Plugin package definition within package.json
 */
export type MashroomPluginPackageDefinition = {|
    /**
     * The build script name for dev mode
     */
    devModeBuildScript?: string,
    /**
     * The plugins in the package
     */
    plugins: Array<MashroomPluginDefinition>
|}

/* Plugin Package */

export type MashroomPluginPackageStatus = 'pending' | 'building' | 'ready' | 'error';
export type MashroomPluginPackageEventName = 'ready' | 'error' | 'removed';
export type MashroomPluginPackageEvent = {|
    +pluginsAdded?: Array<MashroomPluginDefinition>,
    +pluginsUpdated?: Array<MashroomPluginDefinition>,
    +pluginsRemoved?: Array<MashroomPluginDefinition>,
    +errorMessage?: string,
    +pluginPackage: MashroomPluginPackage
|};

/**
 * A Mashroom plugin package
 */
export interface MashroomPluginPackage extends MashroomEventEmitter<MashroomPluginPackageEventName, MashroomPluginPackageEvent> {
    /**
     * The package name (npm package name)
     */
    +name: string;
    /**
     * The package description (npm package description)
     */
    +description: string;
    /**
     * The package version
     */
    +version: string;
    /**
     * Homepage (npm package homepage)
     */
    +homepage: ?string;
    /**
     * The author
     */
    +author: ?string;
    /**
     * The license
     */
    +license: ?string;
    /**
     * The absolute path of the package
     */
    +pluginPackagePath: MashroomPluginPackagePath;
    /**
     * The script name (within the package.json script section) that shall be used to build the package in dev mode
     */
    +devModeBuildScript?: string;
    /**
     * The plugins found within the package
     */
    +pluginDefinitions: Array<MashroomPluginDefinition>;
    /**
     * Status of the plugin package
     */
    +status: MashroomPluginPackageStatus;
    /**
     * Error message if status is error
     */
    +errorMessage: ?string;
}

export type MashroomPluginPackageFactory = (pluginPackagePath: MashroomPluginPackagePath, connector: MashroomPluginPackageRegistryConnector) => MashroomPluginPackage;

export type MashroomPluginType = 'web-app' | 'api' | 'middleware' | 'static' | 'services' | 'storage' | 'plugin-loader' | string;

export type MashroomPluginConfig = {
    [string]: any
}

/**
 * The plugin definition as found within the package.json of the plugin package
 */
export type MashroomPluginDefinition = {
    /**
     * The plugin name (if not set in package.json it will be derived from the package name)
     */
    +name: string;
    /**
     * Optional plugin description
     */
    +description?: ?string;
    /**
     * Optional list of tags
     */
    +tags?: ?Array<string>;
    /**
     * Optional required plugins
     */
    +requires?: ?Array<string>;
    /**
     * Plugin type
     */
    +type: MashroomPluginType;
    /**
     * The bootstrap method
     */
    +bootstrap?: ?string;
    /**
     * The default config of the plugin
     */
    +defaultConfig?: ?MashroomPluginConfig;
    /**
     * Other properties
     */
    +[string]: any;
}

export type MashroomPluginStatus = 'pending' | 'loaded' | 'error';

/**
 * A Mashroom plugin
 */
export interface MashroomPlugin {
    /**
     * The plugin name from the plugin definition
     */
    +name: string;
    /**
     * The plugin description from the plugin definition
     */
    +description: ?string;
    /**
     * The tags list from the plugin definition
     */
    +tags: Array<string>;
    /**
     * The plugin type from the plugin definition
     */
    +type: MashroomPluginType;
    /**
     * The raw plugin definition as found in package.json
     */
    +pluginDefinition: MashroomPluginDefinition;
    /**
     * Returns the bootstrap required from file system (after clearing the module cache).
     */
    requireBootstrap(): any;
    /**
     * The actual config (if already loaded)
     */
    +config: ?MashroomPluginConfig;
    /**
     * The plugin status
     */
    +status: MashroomPluginStatus;
    /**
     * Last reload timestamp if status is 'loaded'
     */
    +lastReloadTs: ?number;
    /**
     * The error message if status is 'error'
     */
    +errorMessage: ?string;
    /**
     * The plugin package containing this plugin
     */
    +pluginPackage: MashroomPluginPackage
}

export type MashroomPluginFactory = (MashroomPluginDefinition, MashroomPluginPackage, MashroomPluginRegistryConnector) => MashroomPlugin;

/**
 * Plugin loader interface
 */
export interface MashroomPluginLoader {
    /**
     * Name of this loader
     */
    +name: string;
    /**
     * Generate a minimum configuration for given plugin (can be empty)
     */
    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig;
    /**
     * Load the given plugin.
     * This method will also be called for each plugin or config update,
     * so it should keep track about loaded plugins internally.
     *
     * Should throw an exception if loading fails.
     */
    load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void>;
    /**
     * Unload the given plugin.
     */
    unload(plugin: MashroomPlugin): Promise<void>;
}

export type MashroomPluginLoaderMap = {
    [pluginType: MashroomPluginType]: MashroomPluginLoader
}

export type MashroomPluginRegistryEventName = 'loaded' | 'unload';
export type MashroomPluginRegistryEvent = {|
    +pluginName: string,
|}

/**
 * Mashroom plugin registry
 */
export interface MashroomPluginRegistry extends MashroomEventEmitter<MashroomPluginRegistryEventName, MashroomPluginRegistryEvent> {
    /**
     * The currently known plugin packages
     */
    +pluginPackages: Array<MashroomPluginPackage>;
    /**
     * The currently known plugins
     */
    +plugins: Array<MashroomPlugin>;
    /**
     * The currently known plugin loaders
     */
    +pluginLoaders: MashroomPluginLoaderMap;
    /**
     * Register (or overwrite existing) plugin loader for given type
     */
    registerPluginLoader(type: MashroomPluginType, loader: MashroomPluginLoader): void;
    /**
     * Unregister given plugin loader
     */
    unregisterPluginLoader(type: MashroomPluginType, loader: MashroomPluginLoader): void;
}

export type MashroomPluginPackageRegistryConnectorEventName = 'updated' | 'removed';
export interface MashroomPluginPackageRegistryConnector extends MashroomEventEmitter<MashroomPluginPackageRegistryConnectorEventName, void> {
    emitUpdated(): void;
    emitRemoved(): void;
}

export type MashroomPluginRegistryConnectorEventName = 'loaded' | 'updated' | 'error';
export type MashroomPluginRegistryConnectorEvent = {|
    +errorMessage?: string,
    +pluginConfig?: MashroomPluginConfig,
    +updatedPluginDefinition?: MashroomPluginDefinition,
|}

export interface MashroomPluginRegistryConnector extends MashroomEventEmitter<MashroomPluginRegistryConnectorEventName, MashroomPluginRegistryConnectorEvent> {
    emitLoaded(event: MashroomPluginRegistryConnectorEvent): void;
    emitError(event: MashroomPluginRegistryConnectorEvent): void;
    emitUpdated(event: MashroomPluginRegistryConnectorEvent): void;
}

/**
 * Mashroom plugin service
 */
export interface MashroomPluginService {
    /**
     * The currently known plugin loaders
     */
    getPluginLoaders(): MashroomPluginLoaderMap;
    /**
     * Get all currently known plugins
     */
    getPlugins(): Array<MashroomPlugin>;
    /**
     * Get all currently known plugin packages
     */
    getPluginPackages(): Array<MashroomPluginPackage>;
    /**
     * Register for the next loaded event of given plugin (fired AFTER the plugin has been loaded).
     */
    onLoadedOnce(pluginName: string, listener: () => void): void;
    /**
     * Register for the next unload event of given plugin (fired BEFORE the plugin is going to be unloaded).
     */
    onUnloadOnce(pluginName: string, listener: () => void): void;
}

/**
 * A service to access and introspect the middleware stack
 */
export interface MashroomMiddlewareStackService {
    /**
     * Check if the stack has given plugin
     */
    has(pluginName: string): boolean;
    /**
     * Execute the given middleware.
     * Throws an exception if it doesn't exists
     */
    apply(pluginName: string, req: ExpressRequest, res: ExpressResponse): Promise<void>;
    /**
     * Get the ordered list of middleware plugin (first in the list is executed first)
     */
    getStack(): Array<{ pluginName: string, order: number }>;
}

/**
 * Mashroom server
 */
export interface MashroomServer {
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Start the server
     */
    stop(): Promise<void>;
}

export type MashroomServices = {
    +[string]: Object
}

export type MashroomCoreServices = {
    +pluginService: MashroomPluginService,
    +middlewareStackService: MashroomMiddlewareStackService,
}

export type MashroomServiceNamespaces = {
    +[string]: MashroomServices
}

export interface MashroomServiceRegistry {
    registerServices(namespace: string, MashroomServices): void;
    unregisterServices(namespace: string): void;
    getServiceNamespaces(): MashroomServiceNamespaces;
}

/**
 * Middleware
 */
export interface MiddlewarePluginDelegate {
    insertOrReplaceMiddleware(pluginName: string, order: number, middleware: ExpressMiddleware): void;
    removeMiddleware(pluginName: string): void;
    middleware(): ExpressMiddleware;
    +middlewareStack: Array<MiddlewareStackEntry>;
}

export type MiddlewareStackEntry = {
    +pluginName: string,
    +middleware: ExpressMiddleware,
    +order: number,
}

/**
 * Mashroom server context
 */
export interface MashroomServerContext {
    +serverInfo: MashroomServerInfo;
    +serverConfigHolder: MashroomServerConfigHolder;
    +loggerFactory: MashroomLoggerFactory;
    +server: MashroomServer;
    +scanner: MashroomPluginPackageScanner;
    +builder: ?MashroomPluginPackageBuilder;
    +pluginContextHolder: MashroomPluginContextHolder,
    +pluginRegistry: MashroomPluginRegistry;
    +serviceRegistry: MashroomServiceRegistry;
    +expressApp: ExpressApplication;
    +middlewarePluginDelegate: MiddlewarePluginDelegate;
}

export type MashroomServerContextFactory = (serverRootPath: string) => Promise<MashroomServerContext>;

export interface MashroomServerContextHolder {
    getServerContext(): MashroomServerContext
}

/**
 * Mashroom plugin context
 *
 * This context will be available in the plugin bootstrap methods
 * and via req.pluginContext.loggerFactory
 */
export type MashroomPluginContext = {
    +serverInfo: MashroomServerInfo;
    +serverConfig: MashroomServerConfig;
    +loggerFactory: MashroomLoggerFactory;
    +services: {
        +core: MashroomCoreServices;
        +[string]: MashroomServices;
    }
}

export interface MashroomPluginContextHolder {
    getPluginContext(): MashroomPluginContext;
}

/**
 * WebSocket support
 */
export type MashroomHttpUpgradeHandler = (request: HttpServerRequest, socket: net$Socket, head: Buffer) => void;

export type ExpressApplicationWithUpgradeHandler = {
    expressApp: ExpressApplication,
    upgradeHandler?: MashroomHttpUpgradeHandler
};

/**
 * Bootstrap method definition for plugin-loader plugins
 */
export type MashroomPluginLoaderPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomPluginLoader>;

/**
 * Bootstrap method definition for web-app plugins
 */
export type MashroomWebAppPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<ExpressApplication | ExpressApplicationWithUpgradeHandler>;

/**
 * Bootstrap method definition for API plugins
 */
export type MashroomApiPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<ExpressRouter>;

/**
 * Bootstrap method definition for middleware plugins
 */
export type MashroomMiddlewarePluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<ExpressMiddleware>;

/**
 * Bootstrap method definition for services plugins
 */
export type MashroomServicesPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomServices>;

