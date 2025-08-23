
import {resolve, isAbsolute} from 'path';
import {fileURLToPath} from 'url';
import {PluginConfigurationError} from '@mashroom/mashroom-utils';

import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomPluginLoader
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalPageEnhancement, MashroomPortalPageEnhancementPlugin,
    MashroomPortalPageEnhancementPluginBootstrapFunction
} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../../type-definitions/internal';

const DEFAULT_ORDER = 1000;

const removeTrailingSlash = (str: string) => {
    return str.endsWith('/') ? str.slice(0, -1) : str;
};

export default class PortalPageEnhancementPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Enhancement Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig {
        return {
            order: DEFAULT_ORDER,
            resourcesRoot: '.',
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        let resourcesRootUri = plugin.pluginDefinition.resourcesRoot || config.resourcesRoot || '.';

        if (resourcesRootUri.indexOf('://') === -1) {
            if (resourcesRootUri.startsWith('./')) {
                resourcesRootUri = resourcesRootUri.slice(2);
            }
            if (plugin.pluginPackage.pluginPackageURL.protocol === 'file:') {
                if (!isAbsolute(resourcesRootUri)) {
                    const packageBasePath = fileURLToPath(plugin.pluginPackage.pluginPackageURL);
                    resourcesRootUri = resolve(packageBasePath, resourcesRootUri);
                } else {
                    // Required for windows, don't remove
                    resourcesRootUri = resolve(resourcesRootUri);
                }
                resourcesRootUri = `file://${resourcesRootUri}`;
            } else {
                let packageURL = removeTrailingSlash(plugin.pluginPackage.pluginPackageURL.toString());
                resourcesRootUri = `${packageURL}/${resourcesRootUri || ''}`;
                resourcesRootUri = removeTrailingSlash(resourcesRootUri);
            }
        }

        const order: number = config.order;

        const pageResources = plugin.pluginDefinition.pageResources;
        if (!pageResources) {
            throw new PluginConfigurationError(`Page Enhancement plugin ${plugin.name}: No pageResources defined`);
        }
        if (Array.isArray(pageResources.js)) {
            pageResources.js.forEach((res: any) => {
                if (!res.dynamicResource && (!res.path || res.path.startsWith('/'))) {
                    throw new PluginConfigurationError(`Page Enhancement plugin ${plugin.name} pageResources.js: One of 'dynamicResource' or 'path' must exist and the 'path' property must not start with a slash`);
                }
            });
        }
        if (Array.isArray(pageResources.css)) {
            pageResources.css.forEach((res: any) => {
                if (!res.dynamicResource && (!res.path || res.path.startsWith('/'))) {
                    throw new PluginConfigurationError(`Page Enhancement plugin ${plugin.name} pageResources.css: One of 'dynamicResource' or 'path' must exist and the 'path' property must not start with a slash`);
                }
            });
        }

        let enhancementPlugin: MashroomPortalPageEnhancementPlugin | undefined = undefined;
        if (plugin.pluginDefinition.bootstrap) {
            const bootstrap: MashroomPortalPageEnhancementPluginBootstrapFunction = plugin.requireBootstrap();
            enhancementPlugin = await bootstrap(plugin.name, config, contextHolder);
        }

        const enhancement: MashroomPortalPageEnhancement = {
            name: plugin.name,
            description: plugin.description,
            version: plugin.pluginPackage.version,
            lastReloadTs: plugin.lastReloadTs || Date.now(),
            order,
            resourcesRootUri,
            pageResources,
            plugin: enhancementPlugin,
        };

        this._logger.info('Registering portal page enhancement:', JSON.stringify({enhancement}));
        this._registry.registerPortalPageEnhancement(enhancement);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering portal page enhancement: ${plugin.name}`);
        this._registry.unregisterPortalPageEnhancement(plugin.name);
    }
}
