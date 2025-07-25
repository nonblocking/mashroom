
import type {Server} from 'net';
import type {URL} from 'url';
import type {RequestHandler, Application} from 'express';
import type {
    LogLevel,
    MashroomServerConfig,
    MashroomEventEmitter,
    MashroomPluginDefinition,
    MashroomPlugin,
    MashroomPluginPackage,
    MashroomPluginConfig,
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
    readonly pluginPackagePath: string;
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
    addToBuildQueue(pluginPackageName: string | undefined | null, pluginPackagePath: string, buildScript: string, lastSourceUpdateTimestamp?: number): void;

    /**
     * Remove from the build queue (if present)
     */
    removeFromBuildQueue(pluginPackageName: string): void;

    /**
     * Stop processing the build queue
     */
    stopProcessing(): void;
}

export type MashroomPluginPackageFactory = (pluginPackagePath: string, connector: MashroomPluginPackageRegistryConnector) => MashroomPluginPackage;
export type MashroomPluginFactory = (definition: MashroomPluginDefinition, pluginPackage: MashroomPluginPackage, connector: MashroomPluginRegistryConnector) => MashroomPlugin;

export type MashroomPluginRegistryEventName = 'loaded' | 'unload';
export type MashroomPluginRegistryEvent = {
    readonly pluginName: string;
}

/**
 * Mashroom plugin registry
 */
export interface MashroomPluginRegistry  {
    /**
     * All known (potential) plugin package URLs
     */
    readonly pluginPackageURLs: Readonly<Array<URL>>;
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
     * Register (or overwrite existing) a plugin scanner
     */
    registerPluginScanner(name: string, scanner: MashroomPluginPackageScanner): void;
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
