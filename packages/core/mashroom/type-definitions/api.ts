
import type {Request, Response, Application, RequestHandler, Router} from 'express';
import type {IncomingMessage} from 'http';
import type {Socket} from 'net';
import type {TlsOptions} from 'tls';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            pluginContext: MashroomPluginContext;
        }
    }
}

export type IncomingMessageWithContext = IncomingMessage & {
    pluginContext: MashroomPluginContext;
    session?: any;
}

export type ExpressRequestWithContext = Request & {
    pluginContext: MashroomPluginContext;
    session?: any;
};

export type I18NString =
    | string
    | { [lang: string]: string;
};

/**
 * Generic event emitter (under the hood node's EventEmitter will be used)
 */
export interface MashroomEventEmitter<N, E> {
    on(eventName: N, listener: (arg0: E) => void): void;
    removeListener(eventName: N, listener: (arg0: E) => void): void;
}

/**
 * Mashroom logger interface
 */
export interface MashroomLogger {
    debug(msg: string, ...args: any[]): void;
    info(msg: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
    addContext(context: any): void;
    withContext(context: any): MashroomLogger;
    getContext(): any;
}

export interface MashroomLoggerContext {
    add(context: any): void;
    get(): any;
    clone(): MashroomLoggerContext;
}

export type MashroomLoggerFactory = {
    (category: string): MashroomLogger;
    bindToContext(context: MashroomLoggerContext): MashroomLoggerFactory;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type MashroomServerInfo = {
    readonly version: string;
    readonly devMode: boolean;
};

/* Plugin Package */

export type PluginPackageFolder = {
    readonly path: string;
    readonly watch?: boolean;
    readonly devMode?: boolean;
};

export type MashroomPluginPackageEventName = 'ready' | 'error' | 'removed';
export type MashroomPluginPackageEvent = {
    readonly pluginsAdded?: Array<MashroomPluginDefinition>;
    readonly pluginsUpdated?: Array<MashroomPluginDefinition>;
    readonly pluginsRemoved?: Array<MashroomPluginDefinition>;
    readonly errorMessage?: string;
    readonly pluginPackage: MashroomPluginPackage;
};

export type MashroomPluginPackageStatus =
    | 'pending'
    | 'building'
    | 'ready'
    | 'error';
export type MashroomPluginPackagePath = string;

/**
 * Plugin package definition within package.json
 */
export type MashroomPluginPackageDefinition = {
    /**
     * The build script name for dev mode
     */
    devModeBuildScript?: string;

    /**
     * The plugins in the package
     */
    plugins: Array<MashroomPluginDefinition>;
};

/**
 * A Mashroom plugin package
 */
export interface MashroomPluginPackage
    extends MashroomEventEmitter<
        MashroomPluginPackageEventName,
        MashroomPluginPackageEvent
        > {
    /**
     * The package name (npm package name)
     */
    readonly name: string;

    /**
     * The package description (npm package description)
     */
    readonly description: string;

    /**
     * The package version
     */
    readonly version: string;

    /**
     * Homepage (npm package homepage)
     */
    readonly homepage: string | null | undefined;

    /**
     * The author
     */
    readonly author: string | null | undefined;

    /**
     * The license
     */
    readonly license: string | null | undefined;

    /**
     * The absolute path of the package
     */
    readonly pluginPackagePath: MashroomPluginPackagePath;

    /**
     * The script name (within the package.json script section) that shall be used to build the package in dev mode
     */
    readonly devModeBuildScript?: string;

    /**
     * The plugins found within the package
     */
    readonly pluginDefinitions: Readonly<Array<MashroomPluginDefinition>>;

    /**
     * Status of the plugin package
     */
    readonly status: MashroomPluginPackageStatus;

    /**
     * Error message if status is error
     */
    readonly errorMessage: string | null | undefined;
}

export type MashroomPluginType =
    | 'web-app'
    | 'api'
    | 'middleware'
    | 'static'
    | 'services'
    | 'storage'
    | 'plugin-loader'
    | 'admin-ui-integration'
    | string;

/**
 * The plugin definition as found within the package.json of the plugin package
 */
export type MashroomPluginDefinition = {
    /**
     * The plugin name (if not set in package.json it will be derived from the package name)
     */
    readonly name: string;

    /**
     * Optional plugin description
     */
    readonly description?: string | null | undefined;

    /**
     * Optional list of tags
     */
    readonly tags?: Array<string> | null | undefined;

    /**
     * Optional required plugins
     */
    readonly requires?: Array<string> | null | undefined;

    /**
     * Plugin type
     */
    readonly type: MashroomPluginType;

    /**
     * The bootstrap method
     */
    readonly bootstrap?: string | null | undefined;

    /**
     * The default config of the plugin
     */
    readonly defaultConfig?: MashroomPluginConfig | null | undefined;
    /**
     * Other properties
     */

    readonly [key: string]: any;
};

export type MashroomPluginStatus = 'pending' | 'loaded' | 'error';

/**
 * A Mashroom plugin
 */
export interface MashroomPlugin {
    /**
     * The plugin name from the plugin definition
     */
    readonly name: string;

    /**
     * The plugin description from the plugin definition
     */
    readonly description: string | null | undefined;

    /**
     * The tags list from the plugin definition
     */
    readonly tags: Array<string>;

    /**
     * The plugin type from the plugin definition
     */
    readonly type: MashroomPluginType;

    /**
     * The raw plugin definition as found in package.json
     */
    readonly pluginDefinition: MashroomPluginDefinition;

    /**
     * Returns the bootstrap required from file system (after clearing the module cache).
     */
    requireBootstrap(): any;

    /**
     * The actual config (if already loaded)
     */
    readonly config: MashroomPluginConfig | null | undefined;

    /**
     * The plugin status
     */
    readonly status: MashroomPluginStatus;

    /**
     * Last reload timestamp if status is 'loaded'
     */
    readonly lastReloadTs: number | null | undefined;

    /**
     * The error message if status is 'error'
     */
    readonly errorMessage: string | null | undefined;

    /**
     * The plugin package containing this plugin
     */
    readonly pluginPackage: MashroomPluginPackage;
}

export type MashroomPluginConfig = {
    [key: string]: any;
};

/**
 * Plugin loader interface
 */
export interface MashroomPluginLoader {
    /**
     * Name of this loader
     */
    readonly name: string;

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
    load(
        plugin: MashroomPlugin,
        config: MashroomPluginConfig,
        contextHolder: MashroomPluginContextHolder,
    ): Promise<void>;

    /**
     * Unload the given plugin.
     */
    unload(plugin: MashroomPlugin): Promise<void>;
}

/**
 * Mashroom server config
 */
export type MashroomServerConfig = {
    readonly name: string;
    readonly port: number;
    readonly httpsPort: number | null | undefined;
    readonly tlsOptions: TlsOptions | null | undefined;
    readonly enableHttp2: boolean;
    readonly trustProxy: boolean | number | string;
    readonly xPowerByHeader: string | null | undefined;
    readonly serverRootFolder: string;
    readonly tmpFolder: string;
    readonly externalPluginConfigFileNames: Array<string>;
    readonly pluginPackageFolders: Array<PluginPackageFolder>;
    readonly ignorePlugins: Array<string>;
    readonly indexPage: string;
    readonly devModeDisableNxSupport: boolean | null | undefined;
    readonly devModeNpmExecutionTimeoutSec: number | null | undefined;

    [key: string]: any;
};

export interface MashroomServicePluginNamespaces {
    readonly [key: string]: MashroomServicePluginServices | undefined;
}

export type MashroomServicePluginServices = {
    readonly [key: string]: any;
};

export type MashroomCoreServices = {
    readonly pluginService: MashroomPluginService;
    readonly middlewareStackService: MashroomMiddlewareStackService;
    readonly httpUpgradeService: MashroomHttpUpgradeService;
    readonly healthProbeService: MashroomHealthProbeService;
};

/* Services */

export type MashroomPluginLoaderMap = {
    [pluginType in MashroomPluginType]?: MashroomPluginLoader
};

export interface MashroomPluginService {
    /**
     * The currently known plugin loaders
     */
    getPluginLoaders(): Readonly<MashroomPluginLoaderMap>;

    /**
     * Get all currently known plugins
     */
    getPlugins(): Readonly<Array<MashroomPlugin>>;

    /**
     * Get all currently known plugin packages
     */
    getPluginPackages(): Readonly<Array<MashroomPluginPackage>>;

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
    apply(
        pluginName: string,
        req: Request,
        res: Response,
    ): Promise<void>;

    /**
     * Get the ordered list of middleware plugin (first in the list is executed first)
     */
    getStack(): Array<{pluginName: string; order: number}>;
}

/**
 * Http/1 Upgrade Handler
 */
export type MashroomHttpUpgradeHandler = (
    request: IncomingMessageWithContext,
    socket: Socket,
    head: Buffer,
) => void;

/**
 * A services to add and remove HTTP/1 upgrade listeners
 */
export interface MashroomHttpUpgradeService {
    /**
     * Register an upgrade handler for given path expression
     */
    registerUpgradeHandler(handler: MashroomHttpUpgradeHandler, pathExpression: string | RegExp): void;
    /**
     * Unregister an upgrade handler
     */
    unregisterUpgradeHandler(handler: MashroomHttpUpgradeHandler): void;
}

/**
 * A services to obtain all available health probes
 */
export interface MashroomHealthProbeService {
    /**
     * Register a new health probe for given plugin
     */
    registerProbe(forPlugin: string, probe: MashroomHealthProbe): void;
    /**
     * Unregister a health probe for given plugin
     */
    unregisterProbe(forPlugin: string): void;
    /**
     * Get all registered probes
     */
    getProbes(): Readonly<Array<MashroomHealthProbe>>;
}

/**
 * Mashroom plugin context
 *
 * This context will be available in the plugin bootstrap methods
 * and via req.pluginContext.loggerFactory
 */
export type MashroomPluginContext = {
    readonly serverInfo: MashroomServerInfo;
    readonly serverConfig: MashroomServerConfig;
    readonly loggerFactory: MashroomLoggerFactory;
    readonly services: {
        readonly core: MashroomCoreServices;
    } & MashroomServicePluginNamespaces;
};

export interface MashroomPluginContextHolder {
    getPluginContext(): MashroomPluginContext;
}

export type ExpressApplicationWithUpgradeHandler = {
    expressApp: Application;
    upgradeHandler?: MashroomHttpUpgradeHandler;
};

export type MashroomHealthProbeStatus = {
    ready: boolean;
    error?: string;
}

export type MashroomHealthProbe = {
    check(): Promise<MashroomHealthProbeStatus>;
};

/**
 * Bootstrap method definition for plugin-loader plugins
 */
export type MashroomPluginLoaderPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomPluginLoader>;

/**
 * Bootstrap method definition for web-app plugins
 */
export type MashroomWebAppPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<Application | ExpressApplicationWithUpgradeHandler>;

/**
 * Bootstrap method definition for API plugins
 */
export type MashroomApiPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<Router>;

/**
 * Bootstrap method definition for middleware plugins
 */
export type MashroomMiddlewarePluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<RequestHandler>;

/**
 * Bootstrap method definition for services plugins
 */
export type MashroomServicesPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomServicePluginServices>;
