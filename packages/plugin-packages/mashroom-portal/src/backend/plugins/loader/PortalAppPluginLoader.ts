
import path from 'path';
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

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig {
        return {
            resourcesRoot: '.',
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const version = plugin.pluginDefinition.clientBootstrap && plugin.pluginDefinition.local ? 2 : 1;
        this._logger.debug(`Detected plugin config version for portal-app ${plugin.name}: ${version}`);

        const clientBootstrap = version == 2 ? plugin.pluginDefinition.clientBootstrap : plugin.pluginDefinition.bootstrap;
        if (!clientBootstrap) {
            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No clientBootstrap function defined`);
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

        // We consider only local resources
        let resourcesRootUri = version == 2 ? plugin.pluginDefinition.local?.resourcesRoot : config.resourcesRoot;
        if (!resourcesRootUri.startsWith('/')) {
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

        const proxies = version === 2 ? config.proxies : config.restProxies;

        const defaultAppConfig = {...plugin.pluginDefinition.defaultConfig?.appConfig || {}, ...config.appConfig || {}};

        let defaultRestrictViewToRoles = config.defaultRestrictViewToRoles;
        if (!defaultRestrictViewToRoles && config.defaultRestrictedToRoles) {
            // Backward compatibility
            defaultRestrictViewToRoles = config.defaultRestrictedToRoles;
        }

        let ssrBootstrap;
        let cachingConfig;
        let editorConfig;
        if (version === 2) {
            ssrBootstrap = plugin.pluginDefinition.local?.ssrBootstrap;
            cachingConfig = plugin.pluginDefinition.caching;
            editorConfig = plugin.pluginDefinition.editor;
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
            lastReloadTs: plugin.lastReloadTs || Date.now(),
            remoteApp: false,
            clientBootstrap,
            screenshots,
            ssrBootstrap,
            ssrInitialHtmlPath: undefined,
            resourcesRootUri,
            cachingConfig,
            editorConfig,
            sharedResources,
            resources,
            defaultRestrictViewToRoles,
            rolePermissions: config.rolePermissions,
            proxies,
            defaultAppConfig
        };

        this._logger.info('Registering portal app:', JSON.stringify({portalApp}));
        this._registry.registerPortalApp(portalApp);
    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering portal app: ${plugin.name}`);
        this._registry.unregisterPortalApp(plugin.name);
    }
}
