
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
import type {MashroomPortalApp} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../../type-definitions/internal';

export default class PortalAppPluginLoader implements MashroomPluginLoader {

    private logger: MashroomLogger;

    constructor(private registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {
            resourcesRoot: '.',
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {

        const globalLaunchFunction = plugin.pluginDefinition.bootstrap;
        if (!globalLaunchFunction) {
            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No bootstrap function defined`);
        }

        const resourcesDef = plugin.pluginDefinition.resources;
        if (!resourcesDef) {
            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No resources defined`);
        }

        const resources = {
            js: resourcesDef.js,
            css: resourcesDef.css,
        };

        if (!resources.js) {
            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No resources.js defined`);
        }

        const sharedResourcesDef = plugin.pluginDefinition.sharedResources;
        let sharedResources = null;
        if (sharedResourcesDef) {
            sharedResources = {
                js: sharedResourcesDef.js,
                css: sharedResourcesDef.css,
            };
        }

        const screenshots = plugin.pluginDefinition.screenshots;

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

        let defaultAppConfig = {};
        if (plugin.pluginDefinition.defaultConfig && plugin.pluginDefinition.defaultConfig.appConfig) {
            defaultAppConfig = {...plugin.pluginDefinition.defaultConfig.appConfig, ...config.appConfig || {}};
        }
        let defaultRestrictViewToRoles = config.defaultRestrictViewToRoles;
        if (!defaultRestrictViewToRoles && config.defaultRestrictedToRoles) {
            // Backward compatibility
            defaultRestrictViewToRoles = config.defaultRestrictedToRoles;
        }

        const portalApp: MashroomPortalApp = {
            name: plugin.name,
            title: plugin.pluginDefinition.title,
            description: plugin.description,
            tags: plugin.tags,
            version: plugin.pluginPackage.version,
            homepage: plugin.pluginDefinition.homepage || plugin.pluginPackage.homepage,
            author: plugin.pluginDefinition.author || plugin.pluginPackage.author,
            license: plugin.pluginPackage.license,
            category: plugin.pluginDefinition.category,
            metaInfo: config.metaInfo,
            lastReloadTs: Date.now(),
            globalLaunchFunction,
            screenshots,
            resourcesRootUri,
            sharedResources,
            resources,
            defaultRestrictViewToRoles,
            rolePermissions: config.rolePermissions,
            restProxies: config.restProxies,
            defaultAppConfig
        };

        this.logger.info('Registering portal app:', JSON.stringify({portalApp}));
        this.registry.registerPortalApp(portalApp);
    }

    async unload(plugin: MashroomPlugin) {
        this.logger.info(`Unregistering portal app: ${plugin.name}`);
        this.registry.unregisterPortalApp(plugin.name);
    }
}
