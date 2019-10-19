// @flow

import path from 'path';
import cluster from 'cluster';
import express from 'express';
import http from 'http';

import MashroomPluginContextHolder from './MashroomPluginContextHolder';
import createLoggerFactory from '../logging/create_logger_factory';
import MashroomServerConfigLoader from '../config/MashroomServerConfigLoader';
import MashroomPluginPackage from '../plugins/MashroomPluginPackage';
import MashroomPlugin from '../plugins/MashroomPlugin';
import MashroomPluginPackageScanner from '../plugins/scanner/MashroomPluginPackageScanner';
import MashroomPluginPackageBuilder from '../plugins/building/MashroomPluginPackageBuilder';
import MashroomPluginRegistry from '../plugins/registry/MashroomPluginRegistry';
import MashroomPluginLoaderLoader from '../plugins/loader/MashroomPluginLoaderLoader';
import MashroomWebAppPluginLoader from '../plugins/loader/MashroomWebAppPluginLoader';
import MashroomApiPluginLoader from '../plugins/loader/MashroomApiPluginLoader';
import MashroomMiddlewarePluginLoader from '../plugins/loader/MashroomMiddlewarePluginLoader';
import MashroomStaticDocumentsPluginLoader from '../plugins/loader/MashroomStaticDocumentsPluginLoader';
import MashroomServicesLoader from '../plugins/loader/MashroomServicesLoader';
import MashroomServiceRegistry from '../services/MashroomServiceRegistry';
import MashroomPluginService from '../services/MashroomPluginService';
import GlobalNodeErrorHandler from '../server/GlobalNodeErrorHandler';
import DefaultExpressErrorHandler from '../server/DefaultExpressErrorHandler';
import ExposePluginContextMiddleware from '../server/ExposePluginContextMiddleware';
import MiddlewarePluginDelegate from '../server/MiddlewarePluginDelegate';
import MashroomMiddlewareStackService from '../services/MashroomMiddlewareStackService';
import XPoweredByHeaderMiddleware from '../server/XPoweredByHeaderMiddleware';
import MashroomServer from '../server/MashroomServer';

import InitializationError from '../errors/InitializationError';

import type {
    MashroomServerContextFactory, MashroomPluginPackageRegistryConnector,
    MashroomPluginRegistry as MashroomPluginRegistryType,
    MashroomServerContext, MashroomPluginContextHolder as MashroomPluginContextHolderType, MashroomLoggerFactory,
    ExpressApplication, MashroomServiceRegistry as MashroomServiceRegistryType, MashroomServerConfig,
    MashroomPluginDefinition, MashroomPluginRegistryConnector, MashroomPluginPackage as MashroomPluginPackageType,
    MiddlewarePluginDelegate as MiddlewarePluginDelegateType, MashroomServerInfo,
    MashroomCoreServices,
} from '../../type-definitions';

/**
 * Server context factory
 *
 * @param {string} serverRootPath
 * @return {MashroomServerContext}
 */
const contextFactory: MashroomServerContextFactory = async (serverRootPath: string) => {

    const loggerFactory = await createLoggerFactory(serverRootPath);

    const serverInfo = createServerInfo();

    const configLoader = new MashroomServerConfigLoader(loggerFactory);
    const serverConfigHolder = configLoader.load(serverRootPath);
    const serverConfig = serverConfigHolder.getConfig();

    const scanner = new MashroomPluginPackageScanner(serverConfig, loggerFactory);
    const builder = createBuilder(serverConfig, loggerFactory);

    const isDevMode = (path) => serverConfig.pluginPackageFolders.some((ppf) => path.indexOf(ppf.path) === 0 && !!ppf.devMode);
    const pluginPackageFactory = (path: string, connector: MashroomPluginPackageRegistryConnector) =>
        new MashroomPluginPackage(path, serverConfig.ignorePlugins, connector, isDevMode(path) ? builder : null, loggerFactory);
    const pluginFactory = (pluginDefinition: MashroomPluginDefinition, pluginPackage: MashroomPluginPackageType, connector: MashroomPluginRegistryConnector) =>
        new MashroomPlugin(pluginDefinition, pluginPackage, connector, loggerFactory);

    const serverContextHolder = createServerContextHolder();
    const pluginContextHolder = new MashroomPluginContextHolder(serverContextHolder);

    const serviceRegistry = new MashroomServiceRegistry();
    const pluginRegistry = new MashroomPluginRegistry(scanner, pluginPackageFactory, pluginFactory, pluginContextHolder, loggerFactory);

    const expressApp = express();
    const httpServer = http.createServer(expressApp);
    addDefaultExpressErrorHandler(expressApp, loggerFactory);

    const middlewarePluginDelegate = new MiddlewarePluginDelegate();
    addDefaultMiddleware(expressApp, pluginContextHolder, middlewarePluginDelegate);

    addDefaultPluginLoaders(pluginRegistry, expressApp, httpServer, serviceRegistry, middlewarePluginDelegate, loggerFactory, pluginContextHolder);
    addCoreServices(serviceRegistry, pluginRegistry, middlewarePluginDelegate, loggerFactory);

    const globalNodeErrorHandler = new GlobalNodeErrorHandler(loggerFactory);
    const server = new MashroomServer(expressApp, httpServer, serverInfo, serverConfig, scanner, globalNodeErrorHandler, loggerFactory);

    const serverContext = {
        serverInfo,
        serverConfigHolder,
        loggerFactory,
        scanner,
        builder,
        pluginRegistry,
        serviceRegistry,
        pluginContextHolder,
        server,
        expressApp,
        middlewarePluginDelegate,
    };

    serverContextHolder.setServerContext(serverContext);

    return serverContext;
};

const isCluster = () => {
    return 'PM2_HOME' in process.env || !cluster.isMaster;
};

const createBuilder = (config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory): ?MashroomPluginPackageBuilder => {
    if (!isCluster()) {
        const anyDevMode = config.pluginPackageFolders.some((ppf) => !!ppf.devMode);
        if (anyDevMode) {
            return new MashroomPluginPackageBuilder(config, loggerFactory);
        }
    } else {
        loggerFactory('mashroom').warn('Cluster mode detected: Disabling devMode!');
    }
    return null;
};

const addDefaultPluginLoaders = (pluginRegistry: MashroomPluginRegistryType, expressApplication: ExpressApplication, httpServer: http$Server,
                                 serviceRegistry: MashroomServiceRegistryType, middlewarePluginDelegate: MiddlewarePluginDelegateType,
                                 loggerFactory: MashroomLoggerFactory, pluginContextHolder: MashroomPluginContextHolderType) => {
    pluginRegistry.registerPluginLoader('plugin-loader', new MashroomPluginLoaderLoader(pluginRegistry, loggerFactory));
    pluginRegistry.registerPluginLoader('api', new MashroomApiPluginLoader(expressApplication, loggerFactory));
    pluginRegistry.registerPluginLoader('web-app', new MashroomWebAppPluginLoader(expressApplication, httpServer, loggerFactory, pluginContextHolder));
    pluginRegistry.registerPluginLoader('static', new MashroomStaticDocumentsPluginLoader(expressApplication, loggerFactory));
    pluginRegistry.registerPluginLoader('middleware', new MashroomMiddlewarePluginLoader(middlewarePluginDelegate, loggerFactory));
    pluginRegistry.registerPluginLoader('services', new MashroomServicesLoader(serviceRegistry, loggerFactory));
};

const addCoreServices = (serviceNamespacesRegistry: MashroomServiceRegistryType, pluginRegistry: MashroomPluginRegistryType,
                         middlewareDelegate: MiddlewarePluginDelegate, loggerFactory: MashroomLoggerFactory) => {

    const pluginService = new MashroomPluginService(pluginRegistry, loggerFactory);
    const middlewareStackService = new MashroomMiddlewareStackService(middlewareDelegate, loggerFactory);

    const coreService: MashroomCoreServices = {
        pluginService,
        middlewareStackService,
    };

    serviceNamespacesRegistry.registerServices('core', coreService);
};

const addDefaultMiddleware = (expressApp: ExpressApplication, pluginContextHolder: MashroomPluginContextHolderType, middlewarePluginDelegate: MiddlewarePluginDelegateType) => {
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

const addDefaultExpressErrorHandler = (expressApp: ExpressApplication, loggerFactory: MashroomLoggerFactory) => {
    const errorHandler = new DefaultExpressErrorHandler(loggerFactory);
    expressApp.use(errorHandler.handler());
};

const createServerContextHolder = () => {
    let _serverContext = null;

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

const createServerInfo = (): MashroomServerInfo => {
    let version = '<unknown>';
    try {
        const mashroomJson = require(path.resolve(__dirname, '../../package.json'));
        version = mashroomJson.version;
    } catch (e) {
        // Ignore
    }

    return {
        version
    };
};

export default contextFactory;
