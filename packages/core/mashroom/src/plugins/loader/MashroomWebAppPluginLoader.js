// @flow

import requestPluginContext from '../../context/request_plugin_context';
import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';

import type {
    ExpressApplication,
    ExpressRequestHandler,
    MashroomHttpUpgradeHandler,
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomWebAppPluginBootstrapFunction,
} from '../../../type-definitions';

export default class MashroomWebAppPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    _log: MashroomLogger;
    _pluginContextHolder: MashroomPluginContextHolder;
    _httpServer: http$Server;
    _upgradeHandlers: Array<{
        pluginName: string,
        path: string,
        handler: MashroomHttpUpgradeHandler
    }>;

    constructor(expressApplication: ExpressApplication, httpServer: http$Server, loggerFactory: MashroomLoggerFactory, pluginContextHolder: MashroomPluginContextHolder) {
        super(expressApplication, loggerFactory);
        this._pluginContextHolder = pluginContextHolder;
        this._log = loggerFactory('mashroom.plugins.loader');
        this._httpServer = httpServer;
        this._upgradeHandlers = [];

        const upgradeHandler = this._upgradeHandler.bind(this);
        httpServer.on('upgrade', upgradeHandler);
    }

    addPluginInstance(expressApplication: ExpressApplication, pluginInstance: ExpressRequestHandler, pluginConfig: MashroomPluginConfig) {
        expressApplication.use(pluginConfig.path, pluginInstance);
    }

    async createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const webAppBootstrap: MashroomWebAppPluginBootstrapFunction = plugin.requireBootstrap();
        const bootstrapResult: any = await webAppBootstrap(plugin.name, pluginConfig, contextHolder);
        const webapp: ExpressApplication = bootstrapResult.expressApp ? bootstrapResult.expressApp : bootstrapResult;
        const upgradeHandler: ?MashroomHttpUpgradeHandler = bootstrapResult.upgradeHandler ? bootstrapResult.upgradeHandler : null;

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

    _upgradeHandler(req: http$IncomingMessage<>, socket: net$Socket, head: Buffer) {
        const path = req.url;
        const entry = this._upgradeHandlers.find((ul) => path.startsWith(ul.path));
        if (entry) {
            const reqWithContext: any = {...req, pluginContext: requestPluginContext(req, this._pluginContextHolder),};
            entry.handler(reqWithContext, socket, head);
        } else {
            this._log.warn(`No upgrade handler found for path ${path}. Ignoring request.`);
            socket.end(`HTTP/1.1 403 Forbidden\r\n\r\n`, 'ascii');
        }
    }

    _installUpgradeHandler(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, handler: MashroomHttpUpgradeHandler) {
        this._uninstallUpgradeHandler(plugin);

        if (!pluginConfig.path || pluginConfig.path === '/') {
            this._log.error(`Ignoring upgrade handler of webapp ${plugin.name} because a valid path is missing in the config`);
            return;
        }

        this._log.info(`Installing HTTP upgrade handler for path: ${pluginConfig.path}`);
        this._upgradeHandlers.push({
            pluginName: plugin.name,
            path: pluginConfig.path,
            handler,
        })
    }

    _uninstallUpgradeHandler(plugin: MashroomPlugin) {
        this._upgradeHandlers = this._upgradeHandlers.filter((uh) => uh.pluginName !== plugin.name);
    }

}
