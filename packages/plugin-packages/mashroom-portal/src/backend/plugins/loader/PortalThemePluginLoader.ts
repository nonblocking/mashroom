
import {isAbsolute, resolve} from 'path';
import {fileURLToPath} from 'url';
import {PluginConfigurationError} from '@mashroom/mashroom-utils';

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
        if (plugin.pluginPackage.pluginPackageURL.protocol !== 'file:') {
            throw new PluginConfigurationError(`Portal Theme plugin ${plugin.name}: Protocol ${plugin.pluginPackage.pluginPackageURL.protocol} not supported'!`);
        }

        const themeBootstrap: MashroomPortalThemePluginBootstrapFunction = await plugin.loadBootstrap();
        const {engineName, engineFactory} = await themeBootstrap(plugin.name, config, contextHolder);

        const pluginPackagePath = fileURLToPath(plugin.pluginPackage.pluginPackageURL);

        let resourcesRootPath = plugin.pluginDefinition.resourcesRoot;
        if (!resourcesRootPath) {
            resourcesRootPath = './dist';
        }
        if (!isAbsolute(resourcesRootPath)) {
            resourcesRootPath = resolve(pluginPackagePath, resourcesRootPath);
        } else {
            // Required for windows, don't remove
            resourcesRootPath = resolve(resourcesRootPath);
        }

        let viewsPath = plugin.pluginDefinition.views;
        if (!viewsPath) {
            viewsPath = './views';
        }
        if (viewsPath.startsWith('.')) {
            viewsPath = resolve(pluginPackagePath, viewsPath);
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
