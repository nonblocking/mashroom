
import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomWebAppPluginBootstrapFunction,
    MashroomHttpUpgradeHandler,
    MashroomHttpUpgradeService,
    ExpressApplicationWithUpgradeHandler,
} from '../../../type-definitions';
import type {RequestHandler, Application} from 'express';

export default class MashroomWebAppPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    private readonly _logger2: MashroomLogger;
    private _upgradeHandlers: Array<{
        readonly pluginName: string,
        readonly upgradeHandler: MashroomHttpUpgradeHandler
    }>;

    constructor(expressApplication: Application, loggerFactory: MashroomLoggerFactory, private _pluginContextHolder: MashroomPluginContextHolder) {
        super(expressApplication, loggerFactory);
        this._logger2 = loggerFactory('mashroom.plugins.loader');
        this._upgradeHandlers = [];
    }

    addPluginInstance(expressApplication: Application, pluginInstance: RequestHandler, pluginConfig: MashroomPluginConfig): void {
        expressApplication.use(pluginConfig.path, pluginInstance as any);
    }

    async createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const webAppBootstrap: MashroomWebAppPluginBootstrapFunction = plugin.requireBootstrap();
        const bootstrapResult = await webAppBootstrap(plugin.name, pluginConfig, contextHolder);
        const webapp: Application = (bootstrapResult as ExpressApplicationWithUpgradeHandler).expressApp || bootstrapResult;
        const upgradeHandler: MashroomHttpUpgradeHandler | undefined | null = (bootstrapResult as ExpressApplicationWithUpgradeHandler).upgradeHandler || null;

        if (upgradeHandler) {
            if (pluginConfig.path && pluginConfig.path !== '/') {
                this._upgradeHandlers.push({
                    pluginName: plugin.name,
                    upgradeHandler,
                });
                this.getHttpUpgradeService().registerUpgradeHandler(upgradeHandler, `^${pluginConfig.path}`);
            } else {
                this._logger2.error(`Ignoring upgrade handler of webapp ${plugin.name} because a valid path is missing in the config`);
            }
        }

        if (webapp && typeof (webapp.disable) === 'function') {
            webapp.disable('x-powered-by');
        }
        return webapp;
    }

    isMiddleware(): boolean {
        return false;
    }

    get name(): string {
        return 'WebApp Plugin Loader';
    }

    beforeUnload(plugin: MashroomPlugin): void {
        const handler = this._upgradeHandlers.find((uh) => uh.pluginName === plugin.name);
        if (handler) {
            this.getHttpUpgradeService().unregisterUpgradeHandler(handler.upgradeHandler);
            this._upgradeHandlers = this._upgradeHandlers.filter((uh) => uh.pluginName !== plugin.name);
        }
    }

    private getHttpUpgradeService(): MashroomHttpUpgradeService {
        return this._pluginContextHolder.getPluginContext().services.core.httpUpgradeService;
    }
}
