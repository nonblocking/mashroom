// @flow

import indexRoute from './routes/index_route';
import mashroomRouter from './routes/mashroom';

import type {
    MashroomServerConfig,
    MashroomLogger,
    MashroomLoggerFactory,
    ExpressApplication,
    MashroomServerInfo,
} from '../../type-definitions';
import type {
    MashroomServer as MashroomServerType,
    GlobalNodeErrorHandler,
    MashroomPluginPackageScanner,
} from  '../../type-definitions/internal';

export default class MashroomServer implements MashroomServerType {

    _serverInfo: MashroomServerInfo;
    _config: MashroomServerConfig;
    _scanner: MashroomPluginPackageScanner;
    _errorHandler: GlobalNodeErrorHandler;
    _log: MashroomLogger;
    _expressApp: ExpressApplication;
    _httpServer: http$Server;

    constructor(expressApp: ExpressApplication, httpServer: http$Server, serverInfo: MashroomServerInfo, config: MashroomServerConfig,
                scanner: MashroomPluginPackageScanner, errorHandler: GlobalNodeErrorHandler, loggerFactory: MashroomLoggerFactory) {
        this._expressApp = expressApp;
        this._httpServer = httpServer;
        this._serverInfo = serverInfo;
        this._config = config;
        this._scanner = scanner;
        this._errorHandler = errorHandler;
        this._log = loggerFactory('mashroom.server');
        this._addServerRoutes();
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
            this._httpServer.listen(this._config.port, (error: ?Error) => {
                if (error) {
                    this._log.error('Failed to start Mashroom server', error);
                    reject(error);
                } else {
                    this._log.info(`Mashroom server started at port ${this._config.port}`);
                    this._scanner.start();
                    this._errorHandler.install();
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
            this._httpServer.close((error) => {
                if (error) {
                    this._log.error('Failed to stop Mashroom server', error);
                    reject(error);
                } else {
                    this._log.info('Mashroom server stopped');
                    resolve();
                }
            });
        });
    }

    _addServerRoutes() {
        this._expressApp.get('/', indexRoute);
        this._expressApp.use('/mashroom', mashroomRouter);
    }

}
