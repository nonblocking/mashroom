
import path from 'path';

import type {MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalTheme, MashroomPortalThemePluginBootstrapFunction} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../../type-definitions/internal';

export default class PortalThemePluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal Theme Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {

        const themeBootstrap: MashroomPortalThemePluginBootstrapFunction = plugin.requireBootstrap();
        const {engineName, engineFactory} = await themeBootstrap(plugin.name, config, contextHolder);

        let resourcesRootPath = plugin.pluginDefinition.resourcesRoot;
        if (!resourcesRootPath) {
            resourcesRootPath = './dist';
        }
        if (resourcesRootPath.startsWith('.')) {
            resourcesRootPath = path.resolve(plugin.pluginPackage.pluginPackagePath, resourcesRootPath);
        }

        let viewsPath = plugin.pluginDefinition.views;
        if (!viewsPath) {
            viewsPath = './views';
        }
        if (viewsPath.startsWith('.')) {
            viewsPath = path.resolve(plugin.pluginPackage.pluginPackagePath, viewsPath);
        }

        const theme: MashroomPortalTheme = {
            name: plugin.name,
            description: plugin.description,
            version: plugin.pluginPackage.version,
            lastReloadTs: plugin.lastReloadTs || Date.now(),
            engineName,
            requireEngine: () => engineFactory(),
            resourcesRootPath,
            viewsPath,
        };

        this._logger.info('Registering theme:', {theme});
        this._registry.registerTheme(theme);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering theme: ${plugin.name}`);
        this._registry.unregisterTheme(plugin.name);
    }
}
