
import http from 'http';
import https from 'https';
import spdy from 'spdy';
import {fixTlsOptions} from '@mashroom/mashroom-utils/lib/tls_utils';
import indexRoute from './routes/index_route';
import mashroomRouter from './routes/mashroom';

import type {Server as HttpServer} from 'http';
import type {Server as HttpsServer} from 'https';
import type {Application} from 'express';
import type {
    MashroomServerConfig,
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomServerInfo,
} from '../../type-definitions';
import type {
    MashroomServer as MashroomServerType,
    GlobalNodeErrorHandler,
    MashroomPluginPackageScanner,
    InternalMashroomHttpUpgradeService,
} from  '../../type-definitions/internal';

export default class MashroomServer implements MashroomServerType {

    _httpServer: HttpServer | undefined;
    _httpsServer: HttpsServer | undefined;
    _logger: MashroomLogger;

    constructor(private _expressApp: Application, private _serverInfo: MashroomServerInfo, private _config: MashroomServerConfig,
                private _scanner: MashroomPluginPackageScanner, private _errorHandler: GlobalNodeErrorHandler,
                private _httpUpgradeService: InternalMashroomHttpUpgradeService, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.server');
        this._addServerRoutes();
    }

    async start(): Promise<void> {
        this._logger.info(`
Starting
   __  ___         __                         ____
  /  |/  /__ ____ / /  _______  ___  __ _    / __/__ _____  _____ ____
 / /|_/ / _ \`(_-</ _ \\/ __/ _ \\/ _ \\/  ' \\  _\\ \\/ -_) __/ |/ / -_) __/
/_/  /_/\\_,_/___/_//_/_/  \\___/\\___/_/_/_/ /___/\\__/_/  |___/\\__/_/

Version ${this._serverInfo.version}
Pid ${process.pid}
`);
        return Promise.all([
            this._startHttpServer(),
            this._startHttpsServer(),
        ]).then(() => { return; });
    }

    async stop(): Promise<void> {
        this._logger.info('Stopping Mashroom server...');

        this._errorHandler.uninstall();
        await this._scanner.stop();

        return Promise.all([
            this._stopHttpServer(),
            this._stopHttpsServer(),
        ]).then(() => { return; });
    }

    private _addServerRoutes() {
        this._expressApp.get('/', indexRoute);
        this._expressApp.use('/mashroom', mashroomRouter);
    }

    private async _startHttpServer(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const httpServer = http.createServer(this._expressApp);
            httpServer.listen(this._config.port, () => {
                this._logger.info(`Mashroom HTTP server available at http://localhost:${this._config.port}`);
                this._scanner.start();
                this._errorHandler.install();
                this._httpServer = httpServer;
                this._httpUpgradeService.addServer(httpServer);
                resolve();
            });
            httpServer.once('error', (error) => {
                this._logger.error('Failed to start HTTP server!', error);
                reject(error);
            });
        });
    }

    private async _startHttpsServer(): Promise<void> {
        if (!this._config.httpsPort) {
            return;
        }
        if (!this._config.tlsOptions) {
            this._logger.error('Cannot enable TLS because no tlsOptions are defined');
            return;
        }

        const fixedTlsOptions = fixTlsOptions(this._config.tlsOptions, this._config.serverRootFolder, this._logger);
        this._logger.debug('Using TLS options: ', fixedTlsOptions);

        return new Promise<void>((resolve, reject) => {
            let httpsServer: HttpsServer;
            if (this._config.enableHttp2) {
                httpsServer = spdy.createServer({
                    ...fixedTlsOptions,
                    spdy: {
                        protocols: ['h2', 'http/1.1'],
                    }
                }, this._expressApp);
            } else {
                httpsServer = https.createServer({
                    ...fixedTlsOptions,
                }, this._expressApp);
            }
            httpsServer.listen(this._config.httpsPort, () => {
                this._logger.info(`Mashroom HTTPS server available at https://localhost:${this._config.httpsPort}`);
                this._scanner.start();
                this._errorHandler.install();
                this._httpsServer = httpsServer;
                this._httpUpgradeService.addServer(httpsServer);
                resolve();
            });
            httpsServer.once('error', (error) => {
                this._logger.error('Failed to start HTTPS server!', error);
                reject(error);
            });
        });
    }

    private async _stopHttpServer(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._httpServer) {
                this._httpServer.close((error) => {
                    if (error) {
                        this._logger.error('Failed to stop HTTP server!', error);
                        reject(error);
                    } else {
                        this._logger.info('HTTP server stopped');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    private async _stopHttpsServer(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._httpsServer) {
                this._httpsServer.close((error) => {
                    if (error) {
                        this._logger.error('Failed to stop HTTPS server!', error);
                        reject(error);
                    } else {
                        this._logger.info('HTTP server stopped');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}
