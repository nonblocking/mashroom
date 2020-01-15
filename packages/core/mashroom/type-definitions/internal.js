// @flow

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
    log(category: string, level: LogLevel, context: ?{}, message: string, args: ?any[]): void;
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

export type MashroomPluginPackageFactory = (pluginPackagePath: MashroomPluginPackagePath, connector: MashroomPluginPackageRegistryConnector) => MashroomPluginPackage;
export type MashroomPluginFactory = (MashroomPluginDefinition, MashroomPluginPackage, MashroomPluginRegistryConnector) => MashroomPlugin;

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

