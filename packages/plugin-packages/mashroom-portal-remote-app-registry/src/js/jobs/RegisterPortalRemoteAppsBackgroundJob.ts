
import {URL} from 'url';
import request from 'request';
import {evaluateTemplatesInConfigObject, INVALID_PLUGIN_NAME_CHARACTERS} from '@mashroom/mashroom-utils/lib/config_utils';
import context from '../context';

import type {
    MashroomLogger,
    MashroomPluginContextHolder,
    MashroomPluginDefinition,
    MashroomPluginPackageDefinition
} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalApp, MashroomPortalProxyDefinitions} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomPortalRemoteAppEndpointService, RemotePortalAppEndpoint} from '../../../type-definitions';
import type {RegisterPortalRemoteAppsBackgroundJob as RegisterPortalRemoteAppsBackgroundJobType,} from '../../../type-definitions/internal';

export default class RegisterPortalRemoteAppsBackgroundJob implements RegisterPortalRemoteAppsBackgroundJobType {

    private _externalPluginConfigFileNames: Array<string>;
    private _logger: MashroomLogger;

    constructor(private _socketTimeoutSec: number , private _registrationRefreshIntervalSec: number, private _pluginContextHolder: MashroomPluginContextHolder) {
        const pluginContext = _pluginContextHolder.getPluginContext();
        this._externalPluginConfigFileNames = pluginContext.serverConfig.externalPluginConfigFileNames;
        this._logger = pluginContext.loggerFactory('mashroom.portal.remoteAppRegistry');
    }

    run(): void {
        this._processInBackground();
    }

    async refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void> {
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this._pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint.service;

        const updatedEndpoint = await this.fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint);

        if (!updatedEndpoint.lastError) {
            updatedEndpoint.portalApps.forEach((portalApp) => {
                this._logger.info('Registering remote portal app:', {portalApp});
                context.registry.registerRemotePortalApp(portalApp)
            });
        } else {
            this._logger.error(`Registering apps for remote portal apps failed: ${remotePortalAppEndpoint.url}. # retries: ${remotePortalAppEndpoint.retries}`);
            remotePortalAppEndpoint.portalApps.forEach((portalApp) => {
                this._logger.info('Unregister remote portal app:', {portalApp});
                context.registry.unregisterRemotePortalApp(portalApp.name)
            });
        }

        await portalRemoteAppEndpointService.updateRemotePortalAppEndpoint(updatedEndpoint);
    }

    async fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<RemotePortalAppEndpoint> {
        this._logger.info(`Fetching remote endpoint data from URL: ${remotePortalAppEndpoint.url}`);

        try {
            const externalPluginDefinition = await this._loadExternalPluginDefinition(remotePortalAppEndpoint);
            const packageJson = await this._loadPackageJson(remotePortalAppEndpoint);

            const portalApps = this.processPluginDefinition(packageJson, externalPluginDefinition, remotePortalAppEndpoint);
            return {
                ...remotePortalAppEndpoint, lastError: null,
                retries: 0,
                registrationTimestamp: Date.now(),
                portalApps
            };

        } catch (error: any) {
            this._logger.error('Processing remote portal app endpoint failed!', error);

            return {
                ...remotePortalAppEndpoint, lastError: error.message,
                retries: remotePortalAppEndpoint.retries + 1,
                registrationTimestamp: null,
                portalApps: []
            };
        }
    }

    private async _processInBackground(): Promise<void> {
        this._logger.info('Start processing remote portal app endpoints');
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this._pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint.service;
        const endpoints = await portalRemoteAppEndpointService.findAll();

        for (const remotePortalAppEndpoint of endpoints) {
            const {registrationTimestamp, portalApps, lastError} = remotePortalAppEndpoint;
            const unregisteredApps = portalApps.some((remoteApp) => !context.registry.portalApps.find((registeredApp) => registeredApp.name === remoteApp.name));
            if (unregisteredApps || lastError || !registrationTimestamp || Date.now() - registrationTimestamp > this._registrationRefreshIntervalSec * 1000) {
                await this.refreshEndpointRegistration(remotePortalAppEndpoint);
            }
        }
    }

    processPluginDefinition(packageJson: any | null, definition: MashroomPluginPackageDefinition | null, remotePortalAppEndpoint: RemotePortalAppEndpoint): Array<MashroomPortalApp> {
        this._logger.debug(`Processing plugin definition of remote portal app endpoint: ${remotePortalAppEndpoint.url}`, packageJson, definition);

        if (!definition) {
            definition = packageJson?.mashroom;
        }
        if (!definition || !Array.isArray(definition.plugins)) {
            throw new Error(`No plugin definition found for remote portal app endpoint: ${remotePortalAppEndpoint.url}. Neither an external plugin definition file nor a "mashroom" property in package.json has been found.`);
        }

        const portalAppDefinitions = definition.plugins.filter((plugin) => plugin.type === 'portal-app');

        if (portalAppDefinitions.length === 0) {
            throw new Error(`No plugin of type portal-app found in remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const portalApps = portalAppDefinitions.map((definition) => this._mapPluginDefinition(packageJson, definition, remotePortalAppEndpoint));

        return portalApps.map((portalApp) => {
            const existingApp = remotePortalAppEndpoint.portalApps?.find((existingApp) => existingApp.name === portalApp.name);
            if (existingApp && existingApp.version === portalApp.version) {
                // Keep reload timestamp for browser caching
                return {...portalApp, lastReloadTs: existingApp.lastReloadTs};
            }

            return portalApp;
        });
    }

    private _mapPluginDefinition(packageJson: any | null, definition: MashroomPluginDefinition, remotePortalAppEndpoint: RemotePortalAppEndpoint): MashroomPortalApp {
        const name = definition.name;
        if (!name) {
            throw new Error(`Invalid portal app definition: No 'name' attribute! Remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
        }
        if (name.match(INVALID_PLUGIN_NAME_CHARACTERS)) {
            throw new Error(`Invalid portal app '${name}': The name contains invalid characters (/,?).`);
        }
        const existingPortalApp = context.registry.portalApps.find((a) => a.name === name && remotePortalAppEndpoint.url.indexOf(a.resourcesRootUri) !== 0);
        if (existingPortalApp) {
            throw new Error(`Invalid portal app '${name}': The name is already defined on endpoint ${existingPortalApp.resourcesRootUri}`);
        }

        const globalLaunchFunction = definition.bootstrap;
        if (!globalLaunchFunction) {
            throw new Error(`Invalid configuration of plugin ${name}: No bootstrap function defined. Remote protal app endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const resourcesDef = definition.resources;
        if (!resourcesDef) {
            throw new Error(`Invalid configuration of plugin ${name}: No resources defined. Remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const resources = {
            js: resourcesDef.js,
            css: resourcesDef.css,
        };
        if (!resources.js) {
            throw new Error(`Invalid configuration of plugin ${name}: No resources.js defined. Remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
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

        const config = definition.defaultConfig || {};
        evaluateTemplatesInConfigObject(config, this._logger);
        const definedRestProxies = config.restProxies;
        const restProxies: MashroomPortalProxyDefinitions = {};

        let defaultRestrictViewToRoles = config.defaultRestrictViewToRoles;
        if (!defaultRestrictViewToRoles && config.defaultRestrictedToRoles) {
            // Backward compatibility
            defaultRestrictViewToRoles = config.defaultRestrictedToRoles;
        }

        // Fix proxy target urls
        if (definedRestProxies) {
            for (const proxyName in definedRestProxies) {
                if (definedRestProxies.hasOwnProperty(proxyName)) {
                    let targetUri = definedRestProxies[proxyName].targetUri;
                    if (!targetUri) {
                        throw new Error(`Invalid configuration of plugin ${name}: No targetUri defined for proxy ${proxyName}.`);
                    }
                    try {
                        const parsedUri = new URL(targetUri);
                        if (parsedUri.hostname === 'localhost') {
                            targetUri = remotePortalAppEndpoint.url + (parsedUri.pathname && parsedUri.pathname !== '/' ? parsedUri.pathname : '');
                        }
                    } catch (e) {
                        // Ignore
                    }
                    restProxies[proxyName] = {...definedRestProxies[proxyName], targetUri};
                }
            }
        }

        const portalApp: MashroomPortalApp = {
            name,
            title: definition.title,
            description: definition.description || packageJson?.description,
            tags: definition.tags || [],
            version: packageJson?.version || new Date().toISOString(),
            homepage: definition.homepage || packageJson?.homepage,
            author: definition.author || packageJson?.author,
            license: packageJson?.license,
            category: definition.category,
            metaInfo: config.metaInfo,
            lastReloadTs: Date.now(),
            globalLaunchFunction,
            resourcesRootUri: remotePortalAppEndpoint.url,
            sharedResources,
            resources,
            screenshots,
            defaultRestrictViewToRoles,
            rolePermissions: config.rolePermissions,
            restProxies,
            defaultAppConfig: config.appConfig
        };

        return portalApp;
    }

    private async _loadPackageJson(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<any | null> {
        const requestOptions = {
            url: `${remotePortalAppEndpoint.url}/package.json`,
            followRedirect: false,
            timeout: this._socketTimeoutSec * 1000,
        };

        return new Promise((resolve) => {
            request.get(requestOptions, (error, response, body) => {
                if (error) {
                    this._logger.warn(`Fetching package.json from ${remotePortalAppEndpoint.url} failed`, error);
                    resolve(null);
                    return;
                }
                if (response.statusCode !== 200) {
                    this._logger.warn(`Fetching package.json from ${remotePortalAppEndpoint.url} failed with status code ${response.statusCode}`);
                    resolve(null);
                    return;
                }
                try {
                    const packageJson = JSON.parse(body);
                    resolve(packageJson);
                } catch (parseError) {
                    this._logger.error(`Parsing package.json from ${remotePortalAppEndpoint.url} failed`, parseError);
                    resolve(null);
                }
            });
        });
    }

    private async _loadExternalPluginDefinition(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<MashroomPluginPackageDefinition | null> {
        const promises = this._externalPluginConfigFileNames.map((name) => {
            const requestOptions = {
                url: `${remotePortalAppEndpoint.url}/${name}.json`,
                followRedirect: false,
                timeout: this._socketTimeoutSec * 1000,
            };

            return new Promise<MashroomPluginPackageDefinition | null>((resolve) => {
                request.get(requestOptions, (error, response, body) => {
                    if (error || response.statusCode !== 200) {
                        this._logger.debug(`Fetching ${name}.json from ${remotePortalAppEndpoint.url} failed`);
                        resolve(null);
                        return;
                    }
                    try {
                        const packageJson = JSON.parse(body);
                        this._logger.debug(`Fetched plugin definition ${name}.json from ${remotePortalAppEndpoint.url}`);
                        resolve(packageJson);
                    } catch (parseError) {
                        this._logger.error(`Parsing ${name}.json from ${remotePortalAppEndpoint.url} failed`, parseError);
                        resolve(null);
                    }
                });
            });
        });

        const configs = await Promise.all(promises);
        return configs.find((c) => !!c) || null;
    }
}
