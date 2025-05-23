
import {URL} from 'url';
import {configUtils} from '@mashroom/mashroom-utils';
import context from '../context';

import type {
    MashroomLogger,
    MashroomPluginContextHolder,
    MashroomPluginDefinition,
    MashroomPluginPackageDefinition
} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalApp, MashroomPortalProxyDefinitions} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomPortalRemoteAppEndpointService, RemotePortalAppEndpoint, InvalidRemotePortalApp} from '../../../type-definitions';
import type {RegisterPortalRemoteAppsBackgroundJob as RegisterPortalRemoteAppsBackgroundJobType,RemoteAppPackageJson} from '../../../type-definitions/internal';

type ServicePortalApps = {
    readonly foundPortalApps: Array<MashroomPortalApp>;
    readonly invalidPortalApps: Array<InvalidRemotePortalApp>;
}

export default class RegisterPortalRemoteAppsBackgroundJob implements RegisterPortalRemoteAppsBackgroundJobType {

    private readonly _externalPluginConfigFileNames: Array<string>;
    private readonly _logger: MashroomLogger;

    constructor(private _socketTimeoutSec: number , private _registrationRefreshIntervalSec: number, private _unregisterAppsAfterScanErrors: number, private _pluginContextHolder: MashroomPluginContextHolder) {
        const pluginContext = _pluginContextHolder.getPluginContext();
        this._externalPluginConfigFileNames = pluginContext.serverConfig.externalPluginConfigFileNames;
        this._logger = pluginContext.loggerFactory('mashroom.portal.remoteAppRegistry');
    }

    async run() {
        try {
            await this._processInBackground();
        } finally {
            context.oneFullScanDone = true;
        }
    }

    async refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void> {
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this._pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint!.service;

        const updatedEndpoint = await this.fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint);

        if (updatedEndpoint.portalApps.length > 0) {
            updatedEndpoint.portalApps.forEach((portalApp) => {
                this._logger.debug('Registering remote Portal App:', {portalApp});
                context.registry.registerRemotePortalApp(portalApp);
            });
        }

        const removedPortalApps = [...remotePortalAppEndpoint.portalApps]
            .filter((existingApp) => !updatedEndpoint.portalApps.find((foundApp) => foundApp.name === existingApp.name));
        removedPortalApps.forEach((portalApp) => {
            this._logger.debug('Unregister remote Portal App:', {portalApp});
            context.registry.unregisterRemotePortalApp(portalApp.name);
        });

        try {
            await portalRemoteAppEndpointService.updateRemotePortalAppEndpoint(updatedEndpoint);
        } catch (e) {
            this._logger.error('Updating/storing remote Portal App endpoint failed!', e);
        }
    }

    async fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<RemotePortalAppEndpoint> {
        this._logger.info(`Fetching remote Portal App endpoint data from URL: ${remotePortalAppEndpoint.url}`);

        try {
            const externalPluginDefinition = await this._loadExternalPluginDefinition(remotePortalAppEndpoint);
            const packageJson = await this._loadPackageJson(remotePortalAppEndpoint);

            const {foundPortalApps, invalidPortalApps} = this.processPluginDefinition(packageJson, externalPluginDefinition, remotePortalAppEndpoint);
            this._logger.info(`Registering remote Portal Apps for endpoint: ${remotePortalAppEndpoint.url}:`, foundPortalApps);
            return {
                ...remotePortalAppEndpoint,
                lastError: null,
                retries: 0,
                registrationTimestamp: Date.now(),
                portalApps: foundPortalApps,
                invalidPortalApps,
            };

        } catch (error: any) {
            this._logger.error(`Processing remote Portal App endpoint ${remotePortalAppEndpoint.url} failed! Retry: ${remotePortalAppEndpoint.retries}`, error);

            const removeRegisteredApps = this._unregisterAppsAfterScanErrors > -1 && remotePortalAppEndpoint.retries >= this._unregisterAppsAfterScanErrors;
            return {
                ...remotePortalAppEndpoint,
                lastError: error.message,
                retries: remotePortalAppEndpoint.retries + 1,
                registrationTimestamp: null,
                portalApps: removeRegisteredApps ? [] : remotePortalAppEndpoint.portalApps,
                invalidPortalApps: removeRegisteredApps ? [] : remotePortalAppEndpoint.invalidPortalApps,
            };
        }
    }

    async _processInBackground(): Promise<void> {
        const startTime = Date.now();
        this._logger.info('Start processing remote Portal App endpoints');

        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this._pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint!.service;
        const endpoints = await portalRemoteAppEndpointService.findAll();

        for (const remotePortalAppEndpoint of endpoints) {
            const {registrationTimestamp, portalApps, lastError} = remotePortalAppEndpoint;
            const unregisteredApps = portalApps.some((remoteApp) => !context.registry.portalApps.find((registeredApp) => registeredApp.name === remoteApp.name));
            if (unregisteredApps || lastError || !registrationTimestamp || Date.now() - registrationTimestamp > this._registrationRefreshIntervalSec * 1000) {
                await this.refreshEndpointRegistration(remotePortalAppEndpoint);
            }
        }

        this._logger.info(`Processed ${endpoints.length} endpoints in ${Date.now() - startTime}ms`);
    }

    processPluginDefinition(packageJson: RemoteAppPackageJson | null, definition: MashroomPluginPackageDefinition | null, remotePortalAppEndpoint: RemotePortalAppEndpoint): ServicePortalApps {
        this._logger.debug(`Processing plugin definition of remote Portal App endpoint: ${remotePortalAppEndpoint.url}`, packageJson, definition);

        if (!definition && packageJson?.mashroom) {
            definition = packageJson.mashroom;
        }
        if (!definition || !Array.isArray(definition.plugins)) {
            throw new Error(`No plugin definition found for remote Portal App endpoint: ${remotePortalAppEndpoint.url}. Neither an external plugin definition file nor a "mashroom" property in package.json has been found.`);
        }

        const portalAppDefinitions = definition.plugins.filter((plugin) => plugin.type === 'portal-app' || plugin.type === 'portal-app2');

        if (portalAppDefinitions.length === 0) {
            throw new Error(`No plugin of type portal-app or portal-app2 found in remote Portal App endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const portalApps: Array<MashroomPortalApp> = [];
        const invalidPortalApps: Array<InvalidRemotePortalApp> = [];
        portalAppDefinitions.forEach((definition) => {
            try {
                portalApps.push(this._mapPluginDefinition(packageJson, definition, remotePortalAppEndpoint));
            } catch (e: any) {
                invalidPortalApps.push({
                    name: definition.name,
                    error: e.message,
                });
            }
        });

        const foundPortalApps = portalApps.map((portalApp) => {
            const existingApp = remotePortalAppEndpoint.portalApps?.find((existingApp) => existingApp.name === portalApp.name);
            if (existingApp && existingApp.version === portalApp.version) {
                // Keep reload timestamp for browser caching
                return {...portalApp, lastReloadTs: existingApp.lastReloadTs};
            }

            return portalApp;
        });

        return {
            foundPortalApps,
            invalidPortalApps,
        };
    }

    private _mapPluginDefinition(packageJson: RemoteAppPackageJson | null, definition: MashroomPluginDefinition, remotePortalAppEndpoint: RemotePortalAppEndpoint): MashroomPortalApp {
        const version = definition.type === 'portal-app2' ? 2 : 1;
        this._logger.debug(`Detected plugin config version for portal-app ${definition.name}: ${version}`);

        const name = definition.name;
        if (!name) {
            throw new Error(`Invalid Portal App definition: No 'name' attribute! Remote Portal App endpoint: ${remotePortalAppEndpoint.url}`);
        }
        if (name.match(configUtils.INVALID_PLUGIN_NAME_CHARACTERS)) {
            throw new Error(`Invalid Portal App '${name}': The name contains invalid characters (/,?).`);
        }

        // Only session endpoints might override existing Apps
        if (!remotePortalAppEndpoint.sessionOnly) {
            const existingPortalApp = context.registry.portalApps.find((a) => a.name === name && a.resourcesRootUri.indexOf(remotePortalAppEndpoint.url) !== 0);
            if (existingPortalApp) {
                throw new Error(`Duplicate Portal App '${name}': The name is already defined on endpoint ${existingPortalApp.resourcesRootUri}`);
            }
        }

        const clientBootstrap = version === 2 ? definition.clientBootstrap : definition.bootstrap;
        if (!clientBootstrap) {
            if (version === 2) {
                throw new Error(`Invalid configuration of plugin ${name}: No clientBootstrap property defined. Remote Portal App endpoint: ${remotePortalAppEndpoint.url}`);
            } else {
                throw new Error(`Invalid configuration of plugin ${name}: No bootstrap property defined. Remote Portal App endpoint: ${remotePortalAppEndpoint.url}`);
            }
        }

        const resourcesDef = definition.resources;
        if (!resourcesDef) {
            throw new Error(`Invalid configuration of plugin ${name}: No resources defined. Remote Portal App endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const resources = {
            js: resourcesDef.js,
            css: resourcesDef.css,
        };
        if (!resources.js) {
            throw new Error(`Invalid configuration of plugin ${name}: No resources.js defined. Remote Portal App endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const sharedResourcesDef = definition.sharedResources;
        let sharedResources = null;
        if (sharedResourcesDef) {
            sharedResources = {
                js: sharedResourcesDef.js,
                css: sharedResourcesDef.css,
            };
        }

        const screenshots = definition.screenshots;

        let resourcesRootUri;
        if (version === 2) {
            resourcesRootUri = `${remotePortalAppEndpoint.url}${definition.remote?.resourcesRoot || ''}`;
            if (resourcesRootUri.endsWith('/')) {
                resourcesRootUri = resourcesRootUri.slice(0, -1);
            }
        } else {
            resourcesRootUri = remotePortalAppEndpoint.url;
        }

        const config = definition.defaultConfig || {};
        configUtils.evaluateTemplatesInConfigObject(config, this._logger);

        const title = version === 2 ? config.title : definition.title;
        const category = version === 2 ? config.category : definition.category;
        const tags = (version === 2 ? config.tags : definition.tags) || [];
        const description = config.description || definition.description || packageJson?.description;

        const definedRestProxies = version === 2 ? config.proxies : config.restProxies;
        const proxies: MashroomPortalProxyDefinitions = {};

        let defaultRestrictViewToRoles = config.defaultRestrictViewToRoles;
        if (!defaultRestrictViewToRoles && config.defaultRestrictedToRoles) {
            // Backward compatibility
            defaultRestrictViewToRoles = config.defaultRestrictedToRoles;
        }

        // Rewrite proxy target urls if they refer to localhost
        if (definedRestProxies) {
            for (const proxyName in definedRestProxies) {
                if (proxyName in definedRestProxies) {
                    let targetUri = definedRestProxies[proxyName].targetUri;
                    if (!targetUri) {
                        throw new Error(`Invalid configuration of plugin ${name}: No targetUri defined for proxy ${proxyName}.`);
                    }
                    if (targetUri.startsWith('/')) {
                        targetUri = remotePortalAppEndpoint.url + targetUri;
                    }
                    try {
                        const parsedUri = new URL(targetUri);
                        if (parsedUri.hostname === 'localhost') {
                            targetUri = remotePortalAppEndpoint.url + (parsedUri.pathname && parsedUri.pathname !== '/' ? parsedUri.pathname : '');
                        }
                    } catch (e) {
                        // Ignore
                    }
                    proxies[proxyName] = {...definedRestProxies[proxyName], targetUri};
                }
            }
        }

        let ssrInitialHtmlUri;
        let cachingConfig;
        let editorConfig;
        if (version === 2) {
            if (definition.remote?.ssrInitialHtmlPath) {
                ssrInitialHtmlUri = `${remotePortalAppEndpoint.url}${definition.remote.ssrInitialHtmlPath}`;
                if (ssrInitialHtmlUri.endsWith('/')) {
                    ssrInitialHtmlUri = ssrInitialHtmlUri.slice(0, -1);
                }
            }
            cachingConfig = config.caching;
            editorConfig = config.editor;
        }

        const portalApp: MashroomPortalApp = {
            name,
            title,
            description,
            tags,
            version: packageJson?.version || new Date().toISOString(),
            homepage: definition.homepage || packageJson?.homepage,
            author: definition.author || packageJson?.author,
            license: packageJson?.license,
            category,
            metaInfo: config.metaInfo,
            lastReloadTs: Date.now(),
            clientBootstrap,
            resourcesRootUri,
            remoteApp: true,
            ssrBootstrap: undefined,
            ssrInitialHtmlUri,
            sharedResources,
            resources,
            cachingConfig,
            editorConfig,
            screenshots,
            defaultRestrictViewToRoles,
            rolePermissions: config.rolePermissions,
            proxies,
            defaultAppConfig: config.appConfig
        };

        return portalApp;
    }

    private async _loadPackageJson(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<RemoteAppPackageJson | null> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(),  this._socketTimeoutSec * 1000);
        try {
            const result = await fetch(`${remotePortalAppEndpoint.url}/package.json`, {
                signal: controller.signal,
            });
            if (result.ok) {
                return await result.json() as RemoteAppPackageJson;
            } else {
                this._logger.warn(`Fetching package.json from ${remotePortalAppEndpoint.url} failed with status code ${result.status}`);
            }
        } catch (e: any) {
            if (e.message.includes('aborted')) {
                throw new Error(`Timeout: Connection to ${remotePortalAppEndpoint.url} timed out after ${this._socketTimeoutSec}sec`);
            }
            throw e;
        } finally {
            clearTimeout(timeout);
        }
        return null;
    }

    private async _loadExternalPluginDefinition(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<MashroomPluginPackageDefinition | null> {
        const promises = this._externalPluginConfigFileNames.map(async (name) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(),  this._socketTimeoutSec * 1000);
            try {
                const result = await fetch(`${remotePortalAppEndpoint.url}/${name}.json`, {
                    signal: controller.signal,
                });

                if (result.ok) {
                    const json = result.json();
                    this._logger.debug(`Fetched plugin definition ${name}.json from ${remotePortalAppEndpoint.url}`);
                    return json;
                } else {
                    this._logger.debug(`Fetching ${name}.json from ${remotePortalAppEndpoint.url} failed with status code ${result.status}`);
                }
            } catch (e: any) {
                if (e.message.includes('aborted')) {
                    throw new Error(`Timeout: Connection to ${remotePortalAppEndpoint.url} timed out after ${this._socketTimeoutSec}sec`);
                }
                throw e;
            } finally {
                clearTimeout(timeout);
            }
        });

        const configs = await Promise.all(promises);
        return configs.find((c) => !!c) as MashroomPluginPackageDefinition || null;
    }
}
