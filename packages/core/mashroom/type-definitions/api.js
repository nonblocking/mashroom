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
export type ExpressApplication = $Application<ExpressRequest, ExpressResponse>;
export type ExpressMiddleware = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => mixed;
export type ExpressErrorHandler = (error: Error, req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => mixed;
export type ExpressRouter = Router<ExpressRequest, ExpressResponse>;
export type ExpressRequestHandler = ExpressApplication | ExpressRouter | ExpressMiddleware | ExpressErrorHandler;

export type I18NString = string | {
    [lang: string]: string
};

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
    getContext(): {};
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

export type MashroomServerInfo = {
    +version: string
}

/* Plugin Package */

export type PluginPackageFolder = {
    +path: string,
    +watch?: boolean,
    +devMode?: boolean,
}

export type MashroomPluginPackageEventName = 'ready' | 'error' | 'removed';
export type MashroomPluginPackageEvent = {|
    +pluginsAdded?: Array<MashroomPluginDefinition>,
    +pluginsUpdated?: Array<MashroomPluginDefinition>,
    +pluginsRemoved?: Array<MashroomPluginDefinition>,
    +errorMessage?: string,
    +pluginPackage: MashroomPluginPackage
|};

export type MashroomPluginPackageStatus = 'pending' | 'building' | 'ready' | 'error';
export type MashroomPluginPackagePath = string;

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

export type MashroomPluginType = 'web-app' | 'api' | 'middleware' | 'static' | 'services' | 'storage' | 'plugin-loader' | string;

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

export type MashroomPluginConfig = {
    [string]: any
}

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

export type MashroomServices = {
    +[string]: any
}

export type MashroomCoreServices = {
    +pluginService: MashroomPluginService,
    +middlewareStackService: MashroomMiddlewareStackService,
}

/* Services */

export type MashroomPluginLoaderMap = {
    [pluginType: MashroomPluginType]: MashroomPluginLoader
}

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


