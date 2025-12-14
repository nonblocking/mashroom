import {removeFromExpressStack} from '../../../utils/reload-utils';
import ExpressRequestHandlerWrapper from './ExpressRequestHandlerWrapper';

import type {
    MashroomLogger,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomWebAppPluginBootstrapFunction,
    MashroomHttpUpgradeHandler,
    MashroomHttpUpgradeService,
    ExpressApplicationWithUpgradeHandler,
    MashroomPluginLoader,
    MashroomLoggerFactory,
} from '../../../../type-definitions';
import type {Application} from 'express';

export default class MashroomWebAppPluginLoader implements MashroomPluginLoader {

    private readonly _logger: MashroomLogger;
    private readonly _loadedPlugins: Map<string, string>;
    private _upgradeHandlers: Array<{
        readonly pluginName: string,
        readonly upgradeHandler: MashroomHttpUpgradeHandler
    }>;

    constructor(private _expressApplication: Application, loggerFactory: MashroomLoggerFactory, private _pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = loggerFactory('mashroom.plugins.loader');
        this._loadedPlugins = new Map();
        this._upgradeHandlers = [];
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {
            path: `/${plugin.name}`,
        };
    }

    async load(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        if (!pluginConfig.path.startsWith('/')) {
            pluginConfig.path = `/${pluginConfig.path}`;
        }

        const webAppBootstrap: MashroomWebAppPluginBootstrapFunction = await plugin.loadBootstrap();
        const bootstrapResult = await webAppBootstrap(plugin.name, pluginConfig, contextHolder);
        const webapp: Application = (bootstrapResult as ExpressApplicationWithUpgradeHandler).expressApp || bootstrapResult;
        const wrapper = new ExpressRequestHandlerWrapper(plugin.name, webapp);

        const upgradeHandler: MashroomHttpUpgradeHandler | undefined | null = (bootstrapResult as ExpressApplicationWithUpgradeHandler).upgradeHandler || null;

        if (upgradeHandler) {
            if (pluginConfig.path && pluginConfig.path !== '/') {
                this._upgradeHandlers.push({
                    pluginName: plugin.name,
                    upgradeHandler,
                });
                this.getHttpUpgradeService().registerUpgradeHandler(upgradeHandler, `^${pluginConfig.path}`);
            } else {
                this._logger.error(`Ignoring upgrade handler of webapp ${plugin.name} because a valid path is missing in the config`);
            }
        }

        if (webapp && typeof (webapp.disable) === 'function') {
            webapp.disable('x-powered-by');
        }

        this._logger.info(`Adding ${plugin.type} Express plugin ${plugin.name} to path: ${pluginConfig.path}`);
        this._expressApplication.use(pluginConfig.path, wrapper.handler());

        this._loadedPlugins.set(plugin.name, pluginConfig.path);
    }

    async unload(plugin: MashroomPlugin) {
        const loadedPluginPath = this._loadedPlugins.get(plugin.name);
        if (loadedPluginPath) {
            this._logger.info(`Removing ${plugin.type} Express plugin ${plugin.name} from path: ${loadedPluginPath}`);
            const handler = this._upgradeHandlers.find((uh) => uh.pluginName === plugin.name);
            if (handler) {
                this.getHttpUpgradeService().unregisterUpgradeHandler(handler.upgradeHandler);
                this._upgradeHandlers = this._upgradeHandlers.filter((uh) => uh.pluginName !== plugin.name);
            }
            removeFromExpressStack(this._expressApplication, plugin);
            this._loadedPlugins.delete(plugin.name);
        }
    }

    get name(): string {
        return 'WebApp Plugin Loader';
    }

    private getHttpUpgradeService(): MashroomHttpUpgradeService {
        return this._pluginContextHolder.getPluginContext().services.core.httpUpgradeService;
    }
}
