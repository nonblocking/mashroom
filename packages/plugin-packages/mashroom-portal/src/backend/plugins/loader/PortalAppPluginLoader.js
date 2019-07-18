// @flow

import path from 'path';
import {PluginConfigurationError} from '@mashroom/mashroom-utils/lib/PluginConfigurationError';

import type {MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalApp, MashroomPortalPluginRegistry} from '../../../../type-definitions';

export default class PortalAppPluginLoader implements MashroomPluginLoader {

    _registry: MashroomPortalPluginRegistry;
    _log: MashroomLogger;

    constructor(registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._registry = registry;
        this._log = loggerFactory('mashroom.portal.plugin.loader');
    }

    get name(): string {
        return 'Portal App Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {};
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

        const globalResourcesDef = plugin.pluginDefinition.globalResources;
        let globalResources = null;
        if (globalResourcesDef) {
            globalResources = {
                js: globalResourcesDef.js,
                css: globalResourcesDef.css,
            };
        }

        const screenshots = plugin.pluginDefinition.screenshots;

        let resourcesRootUri = config.resourcesRoot;
        if (!resourcesRootUri) {
            resourcesRootUri = '.';
        }
        if (resourcesRootUri.indexOf('://') === -1 && !resourcesRootUri.startsWith('/')) {
            // Process relative file path
            resourcesRootUri = path.resolve(plugin.pluginPackage.pluginPackagePath, resourcesRootUri);
        }
        if (resourcesRootUri.indexOf('://') === -1) {
            if (resourcesRootUri.startsWith('/')) {
                resourcesRootUri = 'file://' + resourcesRootUri;
            } else {
                resourcesRootUri = 'file:///' + resourcesRootUri;
            }
        }

        let defaultAppConfig = {};
        if (plugin.pluginDefinition.defaultConfig && plugin.pluginDefinition.defaultConfig.appConfig) {
            defaultAppConfig = Object.assign({}, plugin.pluginDefinition.defaultConfig.appConfig, config.appConfig || {});
        }

        const portalApp: MashroomPortalApp = {
            name: plugin.name,
            title: plugin.pluginDefinition.title,
            description: plugin.description,
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
            resources,
            globalResources,
            defaultRestrictedToRoles: config.defaultRestrictedToRoles,
            rolePermissions: config.rolePermissions,
            restProxies: config.restProxies,
            defaultAppConfig
        };

        this._log.info('Registering portal app:', {portalApp});
        this._registry.registerPortalApp(portalApp);
    }

    async unload(plugin: MashroomPlugin) {
        this._log.info(`Unregistering portal app: ${plugin.name}`);
        this._registry.unregisterPortalApp(plugin.name);
    }
}
