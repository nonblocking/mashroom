
import requestPluginContext from '../../context/request_plugin_context';
import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';

import type {Server, IncomingMessage} from 'http';
import type {Socket} from 'net';
import type {RequestHandler, Application} from 'express';
import type {
    MashroomHttpUpgradeHandler,
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomWebAppPluginBootstrapFunction,
} from '../../../type-definitions';

export default class MashroomWebAppPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    private _logger2: MashroomLogger;
    private _upgradeHandlers: Array<{
        pluginName: string,
        path: string,
        handler: MashroomHttpUpgradeHandler
    }>;

    constructor(expressApplication: Application, httpServer: Server, loggerFactory: MashroomLoggerFactory, private _pluginContextHolder: MashroomPluginContextHolder) {
        super(expressApplication, loggerFactory);
        this._logger2 = loggerFactory('mashroom.plugins.loader');
        this._upgradeHandlers = [];

        const upgradeHandler = this._upgradeHandler.bind(this);
        httpServer.on('upgrade', upgradeHandler);
    }

    addPluginInstance(expressApplication: Application, pluginInstance: RequestHandler, pluginConfig: MashroomPluginConfig) {
        expressApplication.use(pluginConfig.path, pluginInstance as any);
    }

    async createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const webAppBootstrap: MashroomWebAppPluginBootstrapFunction = plugin.requireBootstrap();
        const bootstrapResult: any = await webAppBootstrap(plugin.name, pluginConfig, contextHolder);
        const webapp: Application = bootstrapResult.expressApp ? bootstrapResult.expressApp : bootstrapResult;
        const upgradeHandler: MashroomHttpUpgradeHandler | undefined | null = bootstrapResult.upgradeHandler ? bootstrapResult.upgradeHandler : null;

        if (upgradeHandler) {
            this._installUpgradeHandler(plugin, pluginConfig, upgradeHandler);
        }

        if (webapp && typeof (webapp.disable) === 'function') {
            webapp.disable('x-powered-by');
        }
        return webapp;
    }

    isMiddleware() {
        return false;
    }

    get name(): string {
        return 'WebApp Plugin Loader';
    }

    beforeUnload(plugin: MashroomPlugin) {
        this._uninstallUpgradeHandler(plugin);
    }

    private _upgradeHandler(req: IncomingMessage, socket: Socket, head: Buffer) {
        const path = req.url;
        const entry = path && this._upgradeHandlers.find((ul) => path.startsWith(ul.path));
        if (entry) {
            const reqWithContext: any = {...req, pluginContext: requestPluginContext(req, this._pluginContextHolder),};
            entry.handler(reqWithContext, socket, head);
        } else {
            this._logger2.warn(`No upgrade handler found for path ${path}. Ignoring request.`);
            socket.end(`HTTP/1.1 403 Forbidden\r\n\r\n`, 'ascii');
        }
    }

    private _installUpgradeHandler(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, handler: MashroomHttpUpgradeHandler) {
        this._uninstallUpgradeHandler(plugin);

        if (!pluginConfig.path || pluginConfig.path === '/') {
            this._logger2.error(`Ignoring upgrade handler of webapp ${plugin.name} because a valid path is missing in the config`);
            return;
        }

        this._logger2.info(`Installing HTTP upgrade handler for path: ${pluginConfig.path}`);
        this._upgradeHandlers.push({
            pluginName: plugin.name,
            path: pluginConfig.path,
            handler,
        })
    }

    private _uninstallUpgradeHandler(plugin: MashroomPlugin) {

        this._upgradeHandlers = this._upgradeHandlers.filter((uh) => uh.pluginName !== plugin.name);
    }

}
