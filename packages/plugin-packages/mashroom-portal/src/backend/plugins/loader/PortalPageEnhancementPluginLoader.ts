
import path from 'path';
// @ts-ignore
import PluginConfigurationError from '@mashroom/mashroom-utils/lib/PluginConfigurationError';

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

export default class PortalPageEnhancementPluginLoader implements MashroomPluginLoader {

    private logger: MashroomLogger;

    constructor(private registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Enhancement Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {
            order: DEFAULT_ORDER,
            resourcesRoot: '.',
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {

        let resourcesRootUri = config.resourcesRoot;
        if (resourcesRootUri.indexOf('://') === -1 && !resourcesRootUri.startsWith('/')) {
            // Process relative file path
            resourcesRootUri = path.resolve(plugin.pluginPackage.pluginPackagePath, resourcesRootUri);
        }
        if (resourcesRootUri.indexOf('://') === -1) {
            if (resourcesRootUri.startsWith('/')) {
                resourcesRootUri = `file://${resourcesRootUri}`;
            } else {
                resourcesRootUri = `file:///${resourcesRootUri}`;
            }
        }

        const order: number = config.order;

        const pageResources = plugin.pluginDefinition.pageResources;
        if (!pageResources) {
            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No pageResources defined`);
        }
        if (Array.isArray(pageResources.js)) {
            pageResources.js.forEach((res: any) => {
                if (!res.dynamicResource && (!res.path || res.path.startsWith('/'))) {
                    throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name} pageResources.js: One of 'dynamicResource' or 'path' must exist and the 'path' property must not start with a slash`);
                }
            });
        }
        if (Array.isArray(pageResources.css)) {
            pageResources.css.forEach((res: any) => {
                if (!res.dynamicResource && (!res.path || res.path.startsWith('/'))) {
                    throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name} pageResources.css: One of 'dynamicResource' or 'path' must exist and the 'path' property must not start with a slash`);
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
            lastReloadTs: Date.now(),
            order,
            resourcesRootUri,
            pageResources,
            plugin: enhancementPlugin,
        };

        this.logger.info('Registering portal page enhancement:', JSON.stringify({enhancement}));
        this.registry.registerPortalPageEnhancement(enhancement);
    }

    async unload(plugin: MashroomPlugin) {
        this.logger.info(`Unregistering portal page enhancement: ${plugin.name}`);
        this.registry.unregisterPortalPageEnhancement(plugin.name);
    }
}