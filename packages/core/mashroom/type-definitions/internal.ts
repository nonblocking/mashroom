
import type {Server} from 'net';
import type {RequestHandler, Application} from 'express';
import type {
    LogLevel,
    MashroomServerConfig,
    MashroomEventEmitter,
    MashroomPlugin,
    MashroomPluginPackage,
    MashroomPluginType,
    MashroomPluginLoader,
    MashroomPluginLoaderMap,
    MashroomServerInfo,
    MashroomLoggerFactory,
    MashroomPluginContextHolder,
    MashroomCoreServices,
    MashroomHttpUpgradeService,
    MashroomServicePluginServices,
    MashroomPluginPackageScanner,
    MashroomPluginPackageDefinitionBuilder,
    MashroomPotentialPluginPackage,
} from './api';

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

export interface MashroomLoggerDelegate {
    init(serverRootPath: string): Promise<void>;
    log(category: string, level: LogLevel, context: any | undefined | null, message: string, args: any[] | undefined | null): void;
}

export type MashroomPluginPackageBuilderEventName = 'build-finished';
export type MashroomPluginPackageBuilderEvent = {
    readonly pluginPackageName: string;
    readonly success: boolean;
    readonly errorMessage?: string;
}

/**
 * Mashroom plugin package scanner interface
 */
export interface MashroomPluginPackageBuilder extends MashroomEventEmitter<MashroomPluginPackageBuilderEventName, MashroomPluginPackageBuilderEvent> {

    /**
     * Add given plugin package to build queue
     */
    addToBuildQueue(pluginPackageName: string, pluginPackagePath: string, buildScript: string, lastSourceUpdateTimestamp?: number): void;

    /**
     * Remove from the build queue (if present)
     */
    removeFromBuildQueue(pluginPackageName: string): void;

    /**
     * Stop processing the build queue
     */
    stopProcessing(): void;
}

export type MashroomPluginRegistryEventName = 'loaded' | 'unloaded';
export type MashroomPluginRegistryEvent = {
    readonly pluginName: string;
}


export type MashroomPluginPackageDefinitionBuilderWithWeight = {
    readonly definitionBuilder: MashroomPluginPackageDefinitionBuilder;
    readonly weight: number;
}

/**
 * Mashroom plugin registry
 */
export interface MashroomPluginRegistry extends MashroomEventEmitter<MashroomPluginRegistryEventName, MashroomPluginRegistryEvent> {
    /**
     * All known (potential) plugin package URLs
     */
    readonly potentialPluginPackages: Readonly<Array<MashroomPotentialPluginPackage>>;
    /**
     * The currently known plugin packages
     */
    readonly pluginPackages: Readonly<Array<MashroomPluginPackage>>;
    /**
     * The currently known plugins
     */
    readonly plugins: Readonly<Array<MashroomPlugin>>;
    /**
     * Known plugin loaders
     */
    readonly pluginLoaders: Readonly<MashroomPluginLoaderMap>;
    /**
     * Known plugin package scanners
     */
    readonly pluginPackageScanners: Readonly<Array<MashroomPluginPackageScanner>>;
    /**
     * Known plugin package definition builders
     */
    readonly pluginPackageDefinitionBuilders: Readonly<Array<MashroomPluginPackageDefinitionBuilderWithWeight>>;
    /**
     * Register (or overwrite existing) a plugin scanner
     */
    registerPluginScanner(scanner: MashroomPluginPackageScanner): void;
    /**
     * Unregister a plugin scanner
     */
    unregisterPluginScanner(scanner: MashroomPluginPackageScanner): void;
    /**
     * Register (or overwrite existing) a plugin definition builder
     */
    registerPluginDefinitionBuilder(weight: number, definitionBuilder: MashroomPluginPackageDefinitionBuilder): void;
    /**
     * Unregister a plugin definition scanner
     */
    unregisterPluginDefinitionBuilder(definitionBuilder: MashroomPluginPackageDefinitionBuilder): void;
    /**
     * Register (or overwrite existing) plugin loader for a given type
     */
    registerPluginLoader(type: MashroomPluginType, loader: MashroomPluginLoader): void;
    /**
     * Unregister given plugin loader
     */
    unregisterPluginLoader(type: MashroomPluginType, loader: MashroomPluginLoader): void;
}


/**
 * Mashroom plugin manager
 */
export interface MashroomPluginManager {
    start(): Promise<void>;
    stop(): Promise<void>;
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

export type MashroomServiceNamespaces = {
    readonly core: MashroomCoreServices;
    readonly [namespace: string]: MashroomServicePluginServices
}

export interface MashroomServiceRegistry {
    registerServices(namespace: string, services: MashroomServicePluginServices): void;
    unregisterServices(namespace: string): void;
    getServiceNamespaces(): Readonly<MashroomServiceNamespaces>;
}

/**
 * Middleware
 */
export interface MiddlewarePluginDelegate {
    insertOrReplaceMiddleware(pluginName: string, order: number, middleware: RequestHandler): void;
    removeMiddleware(pluginName: string): void;
    middleware(): RequestHandler;
    readonly middlewareStack: Array<MiddlewareStackEntry>;
}

export type MiddlewareStackEntry = {
    readonly pluginName: string;
    readonly middleware: RequestHandler;
    readonly order: number;
}

/**
 * Mashroom server context
 */
export interface MashroomServerContext {
    readonly serverInfo: MashroomServerInfo;
    readonly serverConfigHolder: MashroomServerConfigHolder;
    readonly loggerFactory: MashroomLoggerFactory;
    readonly server: MashroomServer;
    readonly scanner: MashroomPluginPackageScanner;
    readonly builder: MashroomPluginPackageBuilder | undefined | null;
    readonly pluginContextHolder: MashroomPluginContextHolder,
    readonly pluginRegistry: MashroomPluginRegistry;
    readonly serviceRegistry: MashroomServiceRegistry;
    readonly expressApp: Application;
    readonly middlewarePluginDelegate: MiddlewarePluginDelegate;
}

export type MashroomServerContextFactory = (serverRootPath: string) => Promise<MashroomServerContext>;

export interface MashroomServerContextHolder {
    getServerContext(): MashroomServerContext
}

export interface InternalMashroomHttpUpgradeService extends MashroomHttpUpgradeService {
    addServer(server: Server): void;
}
