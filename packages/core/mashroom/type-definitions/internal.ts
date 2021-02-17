
import type {
    LogLevel,
    MashroomServerConfig,
    MashroomPluginPackagePath,
    MashroomEventEmitter,
    MashroomPluginDefinition,
    MashroomPlugin,
    MashroomPluginPackage,
    MashroomPluginConfig,
    MashroomPluginType,
    MashroomPluginLoader,
    MashroomPluginLoaderMap,
    MashroomServices,
    MashroomServerInfo,
    MashroomLoggerFactory,
    MashroomPluginContextHolder,
    ExpressApplication,
    ExpressMiddleware,
} from './api';
import {MashroomCoreServices} from './api';

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

export type MashroomPluginPackageScannerEventName = 'packageAdded' | 'packageUpdated' | 'packageRemoved';
export type MashroomPluginPackageScannerEvent = MashroomPluginPackagePath;

/**
 * Mashroom plugin package scanner interface
 */
export interface MashroomPluginPackageScanner extends MashroomEventEmitter<MashroomPluginPackageScannerEventName, MashroomPluginPackageScannerEvent> {
    /**
     * Plugin root folders
     */
    readonly pluginPackageFolders: Readonly<Array<string>>;
    /**
     * The currently valid plugin package paths
     */
    readonly pluginPackagePaths: Readonly<Array<MashroomPluginPackagePath>>;
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
     *
     * @param pluginPackageName
     * @param pluginPackagePath
     * @param buildScript
     * @param lastSourceUpdateTimestamp
     */
    addToBuildQueue(pluginPackageName: string, pluginPackagePath: string, buildScript: string | undefined | null, lastSourceUpdateTimestamp?: number): void;

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

export type MashroomPluginPackageFactory = (pluginPackagePath: MashroomPluginPackagePath, connector: MashroomPluginPackageRegistryConnector) => MashroomPluginPackage;
export type MashroomPluginFactory = (definition: MashroomPluginDefinition, pluginPackage: MashroomPluginPackage, connector: MashroomPluginRegistryConnector) => MashroomPlugin;

export type MashroomPluginRegistryEventName = 'loaded' | 'unload';
export type MashroomPluginRegistryEvent = {
    readonly pluginName: string;
}

/**
 * Mashroom plugin registry
 */
export interface MashroomPluginRegistry extends MashroomEventEmitter<MashroomPluginRegistryEventName, MashroomPluginRegistryEvent> {
    /**
     * The currently known plugin packages
     */
    readonly pluginPackages: Readonly<Array<MashroomPluginPackage>>;
    /**
     * The currently known plugins
     */
    readonly plugins: Readonly<Array<MashroomPlugin>>;
    /**
     * The currently known plugin loaders
     */
    readonly pluginLoaders: Readonly<MashroomPluginLoaderMap>;
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
export type MashroomPluginRegistryConnectorEvent = {
    readonly errorMessage?: string;
    readonly pluginConfig?: MashroomPluginConfig;
    readonly updatedPluginDefinition?: MashroomPluginDefinition;
}

export interface MashroomPluginRegistryConnector extends MashroomEventEmitter<MashroomPluginRegistryConnectorEventName, MashroomPluginRegistryConnectorEvent> {
    emitLoaded(event: MashroomPluginRegistryConnectorEvent): void;
    emitError(event: MashroomPluginRegistryConnectorEvent): void;
    emitUpdated(event: MashroomPluginRegistryConnectorEvent): void;
}

/**
 * Mashroom plugin service
 */

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
    readonly [namespace: string]: MashroomServices
}

export interface MashroomServiceRegistry {
    registerServices(namespace: string, services: MashroomServices): void;
    unregisterServices(namespace: string): void;
    getServiceNamespaces(): Readonly<MashroomServiceNamespaces>;
}

/**
 * Middleware
 */
export interface MiddlewarePluginDelegate {
    insertOrReplaceMiddleware(pluginName: string, order: number, middleware: ExpressMiddleware): void;
    removeMiddleware(pluginName: string): void;
    middleware(): ExpressMiddleware;
    readonly middlewareStack: Array<MiddlewareStackEntry>;
}

export type MiddlewareStackEntry = {
    readonly pluginName: string;
    readonly middleware: ExpressMiddleware;
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
    readonly expressApp: ExpressApplication;
    readonly middlewarePluginDelegate: MiddlewarePluginDelegate;
}

export type MashroomServerContextFactory = (serverRootPath: string) => Promise<MashroomServerContext>;

export interface MashroomServerContextHolder {
    getServerContext(): MashroomServerContext
}

