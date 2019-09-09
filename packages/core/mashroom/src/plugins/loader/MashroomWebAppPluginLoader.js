// @flow

import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';

import type {
    MashroomPluginContextHolder,
    ExpressApplication,
    MashroomPluginConfig,
    MashroomWebAppPluginBootstrapFunction,
    MashroomPlugin,
    ExpressRequestHandler,
    MashroomHttpUpgradeHandler,
    MashroomLogger,
    MashroomLoggerFactory,
} from '../../../type-definitions';

export default class MashroomWebAppPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    _log: MashroomLogger;
    _pluginContextHolder: MashroomPluginContextHolder
    _httpServer: http$Server;
    _upgradeHandlers: Array<{
        pluginName: string,
        path: string,
        handler: MashroomHttpUpgradeHandler
    }>;
    _onUnloadHandlers: Array<{
        pluginName: string,
        handler: () => void,
    }>;

    constructor(expressApplication: ExpressApplication, httpServer: http$Server, loggerFactory: MashroomLoggerFactory, pluginContextHolder: MashroomPluginContextHolder) {
        super(expressApplication, loggerFactory);
        this._pluginContextHolder = pluginContextHolder;
        this._log = loggerFactory('mashroom.plugins.loader');
        this._httpServer = httpServer;
        this._upgradeHandlers = [];
        this._onUnloadHandlers = [];

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
        const onUnloadHandler: ?() => void =  bootstrapResult.onUnload ? bootstrapResult.onUnload : null;

        if (upgradeHandler) {
            this._installUpgradeHandler(plugin, pluginConfig, upgradeHandler);
        }
        if (onUnloadHandler) {
            this._installOnUnloadHandler(plugin, onUnloadHandler);
        }

        if (webapp && typeof(webapp.disable) === 'function') {
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
        const wrapper = this._onUnloadHandlers.find((h) => h.pluginName === plugin.name);
        if (wrapper) {
            try {
                this._log.info(`Executing onUnload handler of webapp: ${plugin.name}`);
                wrapper.handler();
            } catch (error) {
                this._log.error(`Error when executing onUnload handler of webapp: ${plugin.name}`)
            }
        }

        this._uninstallUpgradeHandler(plugin);
        this._uninstallOnUnloadHandler(plugin);
    }

    _upgradeHandler(req: http$IncomingMessage<>, socket: net$Socket, head: Buffer) {
        const path = req.url;
        const entry = this._upgradeHandlers.find((ul) => path.startsWith(ul.path));
        if (entry) {
            const reqWithContext: any = Object.assign({}, req, {
                pluginContext: this._pluginContextHolder.getPluginContext()
            });
            entry.handler(reqWithContext, socket, head);
        } else {
            this._log.warn(`No upgrade handler found for path ${path}. Ignoring request.`);
            socket.end(`HTTP/1.1 403 Forbidden\r\n\r\n`,'ascii');
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

    _installOnUnloadHandler(plugin: MashroomPlugin, handler: () => void) {
        this._log.info(`Installing onUnload handler for webapp ${plugin.name}`);
        this._uninstallOnUnloadHandler(plugin);
        this._onUnloadHandlers.push({
            pluginName: plugin.name,
            handler,
        });
    }

    _uninstallOnUnloadHandler(plugin: MashroomPlugin) {
        this._onUnloadHandlers = this._onUnloadHandlers.filter((uh) => uh.pluginName !== plugin.name);
    }
}
