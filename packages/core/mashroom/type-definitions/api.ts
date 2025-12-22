
import type {Request, Response, Application, RequestHandler, Router} from 'express';
import type {IncomingMessage} from 'http';
import type {Socket} from 'net';
import type {TlsOptions} from 'tls';
import type {URL} from 'url';

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

export type MashroomPluginPackageStatus =
    | 'pending'
    | 'building'
    | 'ready'
    | 'error';

/**
 * Plugin package definition within package.json
 */
export type MashroomPluginPackageDefinition = {
    /**
     * The build script name for dev mode
     */
    readonly devModeBuildScript?: string;

    /**
     * An optional path to a build manifest that contains a 'version' or 'timestamp' property.
     * Only for remote packages.
     */
    readonly buildManifestPath?: string;

    /**
     * The plugins in the package
     */
    readonly plugins: Array<MashroomPluginDefinition>;
};

/**
 * Metadata regarding a plugin package.
 * Typically, the stuff which is found in package.json
 */
export type MashroomPluginPackageMeta = {
    readonly name: string;
    readonly version: string;
    readonly description: string | undefined | null;
    readonly homepage: string | undefined | null;
    readonly author: string | undefined | null;
    readonly license: string | undefined | null;
}

/**
 * A Mashroom plugin package
 */
export interface MashroomPluginPackage {
    /**
     * The package name (e.g., npm package name)
     */
    readonly name: string;

    /**
     * The package version
     * Mandatory because this can be used for cache busting in the frontend.
     */
    readonly version: string;

    /**
     * The package description (e.g., npm package description)
     */
    readonly description: string | null | undefined;

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
     * Package URL
     */
    readonly pluginPackageURL: URL;

    /**
     * @deprecated This will be empty for URLs not pointing to the local file system, use pluginPackageURL
     */
    readonly pluginPackagePath: string;

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
     * Loads the bootstrap
     */
    loadBootstrap(): Promise<any>;

    /**
     * Loads the bootstrap via require()
     *
     * @deprecated Use loadBootstrap instead, since it also supports load ES modules
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

export type MashroomPotentialPluginPackage = {
    readonly url: URL;
    readonly scannerName: string;
    readonly definitionBuilderName: string | null;
    readonly lastUpdate: number;
    readonly processedOnce: boolean;
    readonly status: 'processing' | 'processed';
    readonly updateErrors: Array<string> | null;
    readonly foundPlugins: Array<string> | null;
}

export type MashroomPluginScannerHints = {
    readonly packageName?: string;
    readonly packageVersion?: string;
    // The path to the plugin definition (e.g., mashroom.json) if it deviates from the commonly known ones
    readonly pluginDefinitionPath?: string;
    readonly [key: string]: any;
}

export type MashroomPluginScannerCallback = {
    /**
     * Add or update a new package location.
     * It is possible to pass arbitrary hints to MashroomPluginPackageDefinitionBuilder plugins
     */
    addOrUpdatePackageURL(url: URL, hints?: MashroomPluginScannerHints): void;
    removePackageURL(url: URL): void;
}

/**
 * Plugin scanner interface.
 * A plugin scanner reports new/updated plugin package URLs.
 */
export interface MashroomPluginPackageScanner {
    /**
     * Name of this scanner
     */
    readonly name: string;
    /**
     * Set the callback.
     * This will be called after loading the plugin and before calling start().
     */
    setCallback(callback: MashroomPluginScannerCallback): void;
    /**
     * Start the scanner, will be called automatically after loading
     */
    start(): Promise<void>;
    /**
     * Stop the scanner, will be called on unload and when the server stops
     */
    stop():  Promise<void>;
}

export type MashroomPluginPackageDefinitionAndMeta = {
    readonly packageURL: URL;
    readonly definition: MashroomPluginPackageDefinition;
    readonly meta: MashroomPluginPackageMeta;
}

/**
 * Plugin definition builder.
 * Tries to build a MashroomPluginPackageDefinition based on URL.
 * If it is not possible, it must return null (and not throw an error).
 */
export interface MashroomPluginPackageDefinitionBuilder {
    /**
     * Name of this scanner
     */
    readonly name: string;
    /**
     * Build the definition based on given URL.
     * Might return multiple package definitions with an updated package URL in case of a location with submodules or a remote registry.
     *
     * If reading the definition fails, this should throw an error instead of just returning null.
     * (If you return null, existing plugins might be unregistered).
     */
    buildDefinition(packageURL: URL, scannerHints: MashroomPluginScannerHints): Promise<Array<MashroomPluginPackageDefinitionAndMeta> | null>;
}

/**
 * Plugin loader interface
 */
export interface MashroomPluginLoader {
    /**
     * Name of this loader
     */
    readonly name: string;

    /**
     * Generate a minimum configuration for a given plugin (can be empty)
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
    readonly trustProxy: boolean | number | string;
    readonly xPoweredByHeader: string | null | undefined;
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
     * Get all currently known plugins
     */
    getPlugins(): Readonly<Array<MashroomPlugin>>;

    /**
     * Get all currently known plugin packages
     */
    getPluginPackages(): Readonly<Array<MashroomPluginPackage>>;

    /**
     * All potential plugin package URLs reported by plugin package scanners.
     */
    getPotentialPluginPackages(): Readonly<Array<MashroomPotentialPluginPackage>>;

    /**
     * All potential plugin package URLs reported by a specific plugin package scanner.
     */
    getPotentialPluginPackagesByScanner(scannerName: string): Readonly<Array<MashroomPotentialPluginPackage>>;

    /**
     * The currently known plugin loaders
     */
    getPluginLoaders(): Readonly<MashroomPluginLoaderMap>;

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
 * A service to add and remove HTTP/1 upgrade listeners
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
 * A service to obtain all available health probes
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
 * Bootstrap method for plugin-loader plugins
 */
export type MashroomPluginLoaderPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomPluginLoader>;

/**
 * Bootstrap method for plugin-package-scanner plugins
 */
export type MashroomPluginPackageScannerPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomPluginPackageScanner>;

/**
 * Bootstrap method for plugin-package-definition-builder plugins
 */
export type MashroomPluginPackageDefinitionBuilderPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomPluginPackageDefinitionBuilder>;

/**
 * Bootstrap method for web-app plugins
 */
export type MashroomWebAppPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<Application | ExpressApplicationWithUpgradeHandler>;

/**
 * Bootstrap method for API plugins
 */
export type MashroomApiPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<Router>;

/**
 * Bootstrap method for middleware plugins
 */
export type MashroomMiddlewarePluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<RequestHandler>;

/**
 * Bootstrap method for services plugins
 */
export type MashroomServicesPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomServicePluginServices>;
