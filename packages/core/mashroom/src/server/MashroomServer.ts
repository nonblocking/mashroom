
import http from 'http';
import https from 'https';
import {tlsUtils} from '@mashroom/mashroom-utils';
import indexRoute from './routes/index-route';
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
    InternalMashroomHttpUpgradeService, MashroomPluginRegistry,
} from '../../type-definitions/internal';

export default class MashroomServer implements MashroomServerType {

    private _httpServer: HttpServer | undefined;
    private _httpsServer: HttpsServer | undefined;
    private readonly _logger: MashroomLogger;

    constructor(private _expressApp: Application, private _serverInfo: MashroomServerInfo, private _config: MashroomServerConfig,
                private _registry: MashroomPluginRegistry, private _errorHandler: GlobalNodeErrorHandler,
                private _httpUpgradeService: InternalMashroomHttpUpgradeService, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.server');
        this._addServerRoutes();
    }

    async start(): Promise<void> {
        this._logger.info(`
Starting
\x1b[35m╔╦╗┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐┌┬┐  ╔═╗┌─┐┬─┐┬  ┬┌─┐┬─┐\x1b[m
\x1b[35m║║║├─┤└─┐├─┤├┬┘│ ││ ││││  ╚═╗├┤ ├┬┘└┐┌┘├┤ ├┬┘\x1b[m
\x1b[35m╩ ╩┴ ┴└─┘┴ ┴┴└─└─┘└─┘┴ ┴  ╚═╝└─┘┴└─ └┘ └─┘┴└─\x1b[m
\x1b[35m${this._serverInfo.version}\x1b[m
(Pid ${process.pid})
`);
        await Promise.all([
            this._startHttpServer(),
            this._startHttpsServer(),
        ]);
    }

    async stop(): Promise<void> {
        this._logger.info('Stopping Mashroom server...');

        this._errorHandler.uninstall();
        for (let scanner of this._registry.pluginPackageScanners) {
            try {
                await scanner.stop();
            } catch (e) {
                this._logger.warn(`Scanner '${scanner.name}' threw an error on stop`, e);
            }
        }

        await Promise.all([
            this._stopHttpServer(),
            this._stopHttpsServer(),
        ]).then(() => { return; });

        process.exit(0);
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

        const fixedTlsOptions = tlsUtils.fixTlsOptions(this._config.tlsOptions, this._config.serverRootFolder, this._logger);
        this._logger.debug('Using TLS options: ', fixedTlsOptions);

        return new Promise<void>((resolve, reject) => {
            let httpsServer: HttpsServer;
            if (this._config.enableHttp2) {
                // FIXME: spdy is no longer maintained and stopped working with Node.js 15
                this._logger.warn('HTTP/2 support only works properly with Node.js <= 14 at the moment!');
                let spdy;
                try {
                    spdy = require('spdy');
                } catch (e) {
                    this._logger.error('For HTTP/2 you need to install spdy as peer dependency!', e);
                    process.exit(1);
                }
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
                        this._logger.info('HTTPS server stopped');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}
