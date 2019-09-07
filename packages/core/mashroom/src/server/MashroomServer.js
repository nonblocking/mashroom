// @flow

import indexRoute from './routes/index_route';
import infoOverviewRoute from './routes/info_overview_route';
import infoPluginsRoute from './routes/info_plugins_route';
import infoWebappsRoute from './routes/info_webapps_route';
import infoServicesRoute from './routes/info_services_route';
import infoMiddlewareStack from './routes/info_middleware_stack';

import type {Server} from 'http';
import type {
    MashroomServer as MashroomServerType,
    MashroomServerConfig,
    MashroomPluginPackageScanner,
    MashroomLogger,
    MashroomLoggerFactory,
    ExpressApplication,
    GlobalNodeErrorHandler,
    MashroomServerInfo
} from '../../type-definitions';

export default class MashroomServer implements MashroomServerType {

    _serverInfo: MashroomServerInfo;
    _config: MashroomServerConfig;
    _scanner: MashroomPluginPackageScanner;
    _errorHandler: GlobalNodeErrorHandler;
    _log: MashroomLogger;
    _expressApp: ExpressApplication;
    _server: ?Server;

    constructor(expressApp: ExpressApplication, serverInfo: MashroomServerInfo, config: MashroomServerConfig,
                scanner: MashroomPluginPackageScanner, errorHandler: GlobalNodeErrorHandler, loggerFactory: MashroomLoggerFactory) {
        this._expressApp = expressApp;
        this._serverInfo = serverInfo;
        this._config = config;
        this._scanner = scanner;
        this._errorHandler = errorHandler;
        this._log = loggerFactory('mashroom.server');
        this._addBaseRoutes();
    }

    async start() {
        this._log.info(`
Starting
   __  ___         __                         ____                    
  /  |/  /__ ____ / /  _______  ___  __ _    / __/__ _____  _____ ____
 / /|_/ / _ \`(_-</ _ \\/ __/ _ \\/ _ \\/  ' \\  _\\ \\/ -_) __/ |/ / -_) __/
/_/  /_/\\_,_/___/_//_/_/  \\___/\\___/_/_/_/ /___/\\__/_/  |___/\\__/_/        

Version ${this._serverInfo.version}                                                 
`);

        return new Promise((resolve, reject) => {
            this._server = this._expressApp.listen(this._config.port, (error: ?Error) => {
                if (error) {
                    this._log.error('Failed to start Mashroom server', error);
                    reject(error);
                } else {
                    this._log.info(`Mashroom server started at port ${this._config.port}`);
                    this._scanner.start();
                    this._errorHandler.install();
                    setInterval(() => this._showMemoryConsumption(), 60000);

                    resolve();
                }
            });
        });
    }

    async stop() {
        this._log.info('Stopping Mashroom server');

        this._errorHandler.uninstall();
        await this._scanner.stop();

        return new Promise((resolve, reject) => {
            if (this._server) {
                this._server.close((error) => {
                    if (error) {
                        this._log.error('Failed to stop Mashroom server', error);
                        reject(error);
                    } else {
                        this._log.info('Mashroom server stopped');
                        this._server = null;
                        resolve();
                    }
                });
            }
        });
    }

    _showMemoryConsumption() {
        const residentSetMB = Math.trunc(process.memoryUsage().rss / 1024 / 1024);
        this._log.debug(`Current memory consumption: ${residentSetMB} MB`);
    }

    _addBaseRoutes() {
        this._expressApp.get('/', indexRoute);
        this._expressApp.get('/mashroom', infoOverviewRoute);
        this._expressApp.get('/mashroom/plugins', infoPluginsRoute);
        this._expressApp.get('/mashroom/middleware', infoMiddlewareStack);
        this._expressApp.get('/mashroom/webapps', infoWebappsRoute);
        this._expressApp.get('/mashroom/services', infoServicesRoute);
    }

}
