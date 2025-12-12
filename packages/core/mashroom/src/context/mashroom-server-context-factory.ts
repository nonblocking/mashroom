
import path from 'path';
import cluster from 'cluster';
import express from 'express';

import createLoggerDelegate from '../logging/delegates/create-logger-delegate';
import createLoggerFactory from '../logging/create-logger-factory';
import MashroomServerConfigLoader from '../config/MashroomServerConfigLoader';
import MashroomPluginPackageBuilder from '../plugins/building/MashroomPluginPackageBuilder';
import MashroomPluginManager from '../plugins/MashroomPluginManager';
import MashroomPluginLoaderLoader from '../plugins/built-in/loaders/MashroomPluginLoaderLoader';
import MashroomPluginPackageScannerPluginLoader from '../plugins/built-in/loaders/MashroomPluginPackageScannerPluginLoader';
import MashroomPluginPackageDefinitionBuilderPluginLoader from '../plugins/built-in/loaders/MashroomPluginPackageDefinitionBuilderPluginLoader';
import MashroomWebAppPluginLoader from '../plugins/built-in/loaders/MashroomWebAppPluginLoader';
import MashroomApiPluginLoader from '../plugins/built-in/loaders/MashroomApiPluginLoader';
import MashroomMiddlewarePluginLoader from '../plugins/built-in/loaders/MashroomMiddlewarePluginLoader';
import MashroomStaticDocumentsPluginLoader from '../plugins/built-in/loaders/MashroomStaticDocumentsPluginLoader';
import MashroomAdminUIIntegrationLoader from '../plugins/built-in/loaders/MashroomAdminUIIntegrationLoader';
import MashroomServicePluginLoader from '../plugins/built-in/loaders/MashroomServicePluginLoader';
import MashroomLocalFileSystemPluginPackageScanner from '../plugins/built-in/scanners/MashroomLocalFileSystemPluginPackageScanner';
import MashroomDefaultPluginPackageDefinitionBuilder from '../plugins/built-in/definitions/MashroomDefaultPluginPackageDefinitionBuilder';
import MashroomServiceRegistry from '../plugins/MashroomServiceRegistry';
import MashroomPluginService from '../services/MashroomPluginService';
import GlobalNodeErrorHandler from '../server/GlobalNodeErrorHandler';
import ExposePluginContextMiddleware from '../server/ExposePluginContextMiddleware';
import MiddlewarePluginDelegate from '../server/MiddlewarePluginDelegate';
import MashroomMiddlewareStackService from '../services/MashroomMiddlewareStackService';
import MashroomHttpUpgradeService from '../services/MashroomHttpUpgradeService';
import MashroomHealthProbeService from '../services/MashroomHealthProbeService';
import XPoweredByHeaderMiddleware from '../server/XPoweredByHeaderMiddleware';
import MashroomServer from '../server/MashroomServer';
import InitializationError from '../errors/InitializationError';
import {installHotESModuleReloadingHook} from '../utils/reload-utils';
import MashroomPluginContextHolder from './MashroomPluginContextHolder';

import type {Application} from 'express';
import type {
    MashroomLoggerFactory,
    MashroomLogger,
    MashroomServerConfig,
    MashroomServerInfo,
    MashroomCoreServices,
    MashroomPluginContextHolder as MashroomPluginContextHolderType,
} from '../../type-definitions';
import type {
    MashroomServerContextFactory,
    MashroomPluginRegistry as MashroomPluginRegistryType,
    MashroomServerContext,
    MashroomServiceRegistry as MashroomServiceRegistryType,
    MiddlewarePluginDelegate as MiddlewarePluginDelegateType,
    InternalMashroomHttpUpgradeService,
} from '../../type-definitions/internal';


/**
 * Server context factory
 *
 * @param {string} serverRootPath
 * @return {MashroomServerContext}
 */
const contextFactory: MashroomServerContextFactory = async (serverRootPath: string) => {

    const loggerDelegate = await createLoggerDelegate(serverRootPath);
    const loggerFactory = await createLoggerFactory(loggerDelegate);
    const logger = loggerFactory('mashroom');

    const configLoader = new MashroomServerConfigLoader(loggerFactory);
    const serverConfigHolder = await configLoader.load(serverRootPath);
    const serverConfig = serverConfigHolder.getConfig();

    const devMode: boolean = isDevMode(serverConfig, logger);
    if (devMode) {
        await installHotESModuleReloadingHook(logger);
    }

    const scanner = new MashroomLocalFileSystemPluginPackageScanner(serverConfig, loggerFactory);
    const builder = devMode ? createBuilder(serverConfig, loggerFactory) : null;
    const serverContextHolder = createServerContextHolder();
    const pluginContextHolder = new MashroomPluginContextHolder(serverContextHolder);

    const serviceRegistry = new MashroomServiceRegistry();
    const pluginManager = new MashroomPluginManager(pluginContextHolder, loggerFactory, builder);

    const expressApp = express();
    setExpressConfig(expressApp, devMode, logger);

    const middlewarePluginDelegate = new MiddlewarePluginDelegate();
    addDefaultMiddleware(expressApp, pluginContextHolder, middlewarePluginDelegate);

    addBuiltInPlugins(pluginManager, expressApp, serviceRegistry, middlewarePluginDelegate,
        serverConfig, loggerFactory, pluginContextHolder);
    const {httpUpgradeService} = addCoreServices(serviceRegistry, pluginManager, middlewarePluginDelegate, loggerFactory, pluginContextHolder);

    const serverInfo = createServerInfo(devMode);
    const globalNodeErrorHandler = new GlobalNodeErrorHandler(loggerFactory);
    const server = new MashroomServer(expressApp, serverInfo, serverConfig, pluginManager, globalNodeErrorHandler, httpUpgradeService as InternalMashroomHttpUpgradeService, loggerFactory);

    const serverContext: MashroomServerContext = {
        serverInfo,
        serverConfigHolder,
        loggerFactory,
        scanner,
        builder,
        pluginRegistry: pluginManager,
        serviceRegistry,
        pluginContextHolder,
        server,
        expressApp,
        middlewarePluginDelegate,
    };

    serverContextHolder.setServerContext(serverContext);

    setImmediate(async () => {
        await pluginManager.start();
    });

    return serverContext;
};

const isCluster = () => {
    return 'PM2_HOME' in process.env || !cluster.isMaster;
};

const isDevMode = (serverConfig: MashroomServerConfig, logger: MashroomLogger) => {
    let devMode = serverConfig.pluginPackageFolders.some((ppf) => !!ppf.devMode);
    if (devMode && isCluster()) {
        logger.warn('Cluster mode detected: Disabling dev mode!');
        devMode = false;
    }
    if (devMode) {
        logger.info('Some packages are in dev mode. Don\'t use this configuration in production.');
    }
    return devMode;
};

const createBuilder = (config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory): MashroomPluginPackageBuilder => {
    return new MashroomPluginPackageBuilder(config, loggerFactory);
};

const addBuiltInPlugins = (pluginRegistry: MashroomPluginRegistryType, expressApplication: Application,
                           serviceRegistry: MashroomServiceRegistryType, middlewarePluginDelegate: MiddlewarePluginDelegateType,
                           serverConfig: MashroomServerConfig, loggerFactory: MashroomLoggerFactory,
                           pluginContextHolder: MashroomPluginContextHolderType) => {

    pluginRegistry.registerPluginLoader('plugin-loader', new MashroomPluginLoaderLoader(pluginRegistry, loggerFactory));
    pluginRegistry.registerPluginLoader('plugin-package-scanner', new MashroomPluginPackageScannerPluginLoader(pluginRegistry, loggerFactory));
    pluginRegistry.registerPluginLoader('plugin-package-definition-builder', new MashroomPluginPackageDefinitionBuilderPluginLoader(pluginRegistry, loggerFactory));
    pluginRegistry.registerPluginLoader('api', new MashroomApiPluginLoader(expressApplication, loggerFactory));
    pluginRegistry.registerPluginLoader('web-app', new MashroomWebAppPluginLoader(expressApplication, loggerFactory, pluginContextHolder));
    pluginRegistry.registerPluginLoader('static', new MashroomStaticDocumentsPluginLoader(expressApplication, loggerFactory));
    pluginRegistry.registerPluginLoader('middleware', new MashroomMiddlewarePluginLoader(middlewarePluginDelegate, loggerFactory));
    pluginRegistry.registerPluginLoader('services', new MashroomServicePluginLoader(serviceRegistry, loggerFactory));
    pluginRegistry.registerPluginLoader('admin-ui-integration', new MashroomAdminUIIntegrationLoader(loggerFactory));

    pluginRegistry.registerPluginDefinitionBuilder(0, new MashroomDefaultPluginPackageDefinitionBuilder(serverConfig, loggerFactory));

    pluginRegistry.registerPluginScanner(new MashroomLocalFileSystemPluginPackageScanner(serverConfig, loggerFactory));
};

const addCoreServices = (serviceNamespacesRegistry: MashroomServiceRegistryType, pluginRegistry: MashroomPluginRegistryType,
                         middlewareDelegate: MiddlewarePluginDelegate, loggerFactory: MashroomLoggerFactory,
                         pluginContextHolder: MashroomPluginContextHolderType): MashroomCoreServices => {

    const pluginService = new MashroomPluginService(pluginRegistry, loggerFactory);
    const middlewareStackService = new MashroomMiddlewareStackService(middlewareDelegate, loggerFactory);
    const httpUpgradeService = new MashroomHttpUpgradeService(pluginContextHolder);
    const healthProbeService = new MashroomHealthProbeService();

    const coreService: MashroomCoreServices = {
        pluginService,
        middlewareStackService,
        httpUpgradeService,
        healthProbeService,
    };

    serviceNamespacesRegistry.registerServices('core', coreService);

    return coreService;
};

const addDefaultMiddleware = (expressApp: Application, pluginContextHolder: MashroomPluginContextHolderType,
                              middlewarePluginDelegate: MiddlewarePluginDelegateType) => {
    // Plugin context middleware must be the first
    const exposePluginContextMiddleware = new ExposePluginContextMiddleware(pluginContextHolder);
    expressApp.use(exposePluginContextMiddleware.middleware());

    // Middleware plugins
    expressApp.use(middlewarePluginDelegate.middleware());

    // X-Powered-By
    expressApp.disable('x-powered-by');
    const xPoweredByHeaderMiddleware = new XPoweredByHeaderMiddleware(pluginContextHolder);
    expressApp.use(xPoweredByHeaderMiddleware.middleware());
};

const setExpressConfig = (expressApp: Application, devMode: boolean, logger: MashroomLogger) => {
    if (!devMode) {
        logger.info('Enabling express template cache');
        expressApp.enable('view cache');
    }
};

const createServerContextHolder = () => {
    let _serverContext: MashroomServerContext | null = null;

    return {
        getServerContext: () => {
            if (!_serverContext) {
                throw new InitializationError('Access to server context while startup in progress!');
            }
            return _serverContext;
        },
        setServerContext: (serverContext: MashroomServerContext) => _serverContext = serverContext,
    };
};

const createServerInfo = (devMode: boolean): MashroomServerInfo => {
    let version = '<unknown>';
    try {
        const mashroomJson = require(path.resolve(__dirname, '../../package.json'));
        version = mashroomJson.version;
    } catch (e) {
        // Ignore
    }

    return {
        version,
        devMode,
    };
};

export default contextFactory;
