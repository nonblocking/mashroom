
import {isAbsolute, resolve} from 'path';
import {fileURLToPath, URL} from 'url';
import {PluginConfigurationError} from '@mashroom/mashroom-utils';

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

const removeTrailingSlash = (str: string) => {
    return str.endsWith('/') ? str.slice(0, -1) : str;
};

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
        const version = plugin.type === 'portal-app2' ? 2 : 1;
        this._logger.debug(`Detected plugin config version for portal-app ${plugin.name}: ${version}`);

        if (version === 1) {
            this._logger.warn(`Plugin ${plugin.name} is using the legacy 'portal-app' type. Please convert to type 'portal-app2'.`);
        }

        const clientBootstrap = version == 2 ? plugin.pluginDefinition.clientBootstrap : plugin.pluginDefinition.bootstrap;
        if (!clientBootstrap) {
            if (version === 2) {
                throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No clientBootstrap property defined`);
            } else {
                throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No bootstrap property defined`);
            }
        }

        const resourcesDef = plugin.pluginDefinition.resources;
        if (!resourcesDef) {
            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No resources defined`);
        }

        if (resourcesDef.moduleSystem && !['node' ,'ESM', 'SystemJS'].includes(resourcesDef.moduleSystem)) {
            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: Invalid moduleSystem: ${resourcesDef.moduleSystem}`);
        }
        if (resourcesDef.importMap && resourcesDef.moduleSystem !== 'SystemJS') {
            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: importMap only supported for moduleSystem SystemJS`);
        }

        let moduleSystem = resourcesDef.moduleSystem ?? 'none';
        if (resourcesDef.js.find((res: string) => res.endsWith('.mjs'))) {
            moduleSystem = 'ESM';
        }
        const resources = {
            moduleSystem,
            importMap: resourcesDef.importMap ? {
                imports: resourcesDef.importMap.imports ?? [],
            } : undefined,
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

        // Find out where the resources are
        let resourcesRootUri;
        if (plugin.pluginPackage.pluginPackageURL.protocol === 'file:') {
            // Local
            const pluginPackagePath = fileURLToPath(plugin.pluginPackage.pluginPackageURL);
            resourcesRootUri = version == 2 ? (plugin.pluginDefinition.local?.resourcesRoot ?? './dist') : config.resourcesRoot;
            if (!isAbsolute(resourcesRootUri)) {
                // Process relative file path
                resourcesRootUri = resolve(pluginPackagePath, resourcesRootUri);
            } else {
                // Required for windows, don't remove
                resourcesRootUri = resolve(resourcesRootUri);
            }
            resourcesRootUri = `file://${resourcesRootUri}`;
        } else {
            // Remote
            let packageURL = removeTrailingSlash(plugin.pluginPackage.pluginPackageURL.toString());
            if (version === 2) {
                resourcesRootUri = `${packageURL}${plugin.pluginDefinition.remote?.resourcesRoot || ''}`;
                resourcesRootUri = removeTrailingSlash(resourcesRootUri);
            } else {
                resourcesRootUri = packageURL;
            }
        }

        const title = version === 2 ? config.title : plugin.pluginDefinition.title;
        const category = version === 2 ? config.category : plugin.pluginDefinition.category;
        const tags = (version === 2 ? config.tags : plugin.pluginDefinition.tags) || [];
        const description = config.description || plugin.description;

        const proxies = version === 2 ? config.proxies : config.restProxies;
        // Check and fix proxies
        if (proxies) {
            for (const proxyName in proxies) {
                if (proxyName in proxies) {
                    const {targetUri, targetPath, ...otherProps} = proxies[proxyName];
                    let fixedTargetUri = targetUri;
                    if (plugin.pluginPackage.pluginPackageURL.protocol === 'file:') {
                        if (!fixedTargetUri) {
                            if (targetPath) {
                                throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No targetUri defined for proxy ${proxyName}. And targetPath can only be used for remote plugins!`);
                            } else {
                                throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No targetUri defined for proxy ${proxyName}`);
                            }
                        }
                    } else {
                        // For remote Apps targetPath might be set, or the targetUri could be relative, or the targetUri could be localhost (which can be interpreted as relative as well)
                        let packageURL = removeTrailingSlash(plugin.pluginPackage.pluginPackageURL.toString());
                        if (targetPath) {
                            if (!targetPath.startsWith('/')) {
                                throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: targetPath must start with a slash!`);
                            }
                            fixedTargetUri = packageURL + targetPath;
                        } else if (targetUri.startsWith('/')) {
                            fixedTargetUri = packageURL + targetUri;
                        } else {
                            try {
                                const parsedUri = new URL(targetUri);
                                if (parsedUri.hostname === 'localhost') {
                                    fixedTargetUri = packageURL + (parsedUri.pathname && parsedUri.pathname !== '/' ? parsedUri.pathname : '');
                                }
                            } catch (e) {
                                // Ignore
                            }
                        }
                        if (!fixedTargetUri) {
                            throw new PluginConfigurationError(`Invalid configuration of plugin ${plugin.name}: No targetUri defined for proxy ${proxyName}`);
                        }
                        proxies[proxyName] = {
                            targetUri: fixedTargetUri,
                            ...otherProps,
                        };
                    }
                }
            }
        }

        const defaultAppConfig = {...plugin.pluginDefinition.defaultConfig?.appConfig || {}, ...config.appConfig || {}};

        let defaultRestrictViewToRoles = config.defaultRestrictViewToRoles;
        if (!defaultRestrictViewToRoles && config.defaultRestrictedToRoles) {
            // Backward compatibility
            defaultRestrictViewToRoles = config.defaultRestrictedToRoles;
        }

        let ssrBootstrap;
        let ssrInitialHtmlUri;
        let cachingConfig;
        let editorConfig;
        if (version === 2) {
            if (plugin.pluginPackage.pluginPackageURL.protocol === 'file:' && plugin.pluginDefinition.local?.ssrBootstrap) {
                const pluginPackagePath = fileURLToPath(plugin.pluginPackage.pluginPackageURL);
                const relativeSSRBootstrap = plugin.pluginDefinition.local.ssrBootstrap;
                ssrBootstrap = relativeSSRBootstrap && resolve(pluginPackagePath, relativeSSRBootstrap);
            } else if (plugin.pluginDefinition.remote?.ssrInitialHtmlPath) {
                let packageURL = removeTrailingSlash(plugin.pluginPackage.pluginPackageURL.toString());
                ssrInitialHtmlUri = `${packageURL}${plugin.pluginDefinition.remote.ssrInitialHtmlPath}`;
                if (ssrInitialHtmlUri.endsWith('/')) {
                    ssrInitialHtmlUri = ssrInitialHtmlUri.slice(0, -1);
                }
            }
            cachingConfig = config.caching;
            editorConfig = config.editor;
        }

        const portalApp: MashroomPortalApp = {
            name: plugin.name,
            title,
            description,
            tags,
            version: plugin.pluginPackage.version,
            homepage: plugin.pluginDefinition.homepage || plugin.pluginPackage.homepage,
            author: plugin.pluginDefinition.author || plugin.pluginPackage.author,
            license: plugin.pluginPackage.license,
            category,
            metaInfo: config.metaInfo,
            lastReloadTs: plugin.lastReloadTs || Date.now(),
            remoteApp: false,
            clientBootstrap,
            screenshots,
            ssrBootstrap,
            ssrInitialHtmlUri,
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
