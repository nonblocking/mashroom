// @flow
/* eslint no-unused-vars: off */

import url from 'url';
import request from 'request';
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

    _socketTimeoutSec: number;
    _checkIntervalSec: number;
    _registrationRefreshIntervalSec: number;
    _pluginContextHolder: MashroomPluginContextHolder;
    _logger: MashroomLogger;
    _timeout: ?TimeoutID;

    constructor(socketTimeoutSec: number, checkIntervalSec: number, registrationRefreshIntervalSec: number, pluginContextHolder: MashroomPluginContextHolder) {
        this._socketTimeoutSec = socketTimeoutSec;
        this._checkIntervalSec = checkIntervalSec;
        this._registrationRefreshIntervalSec = registrationRefreshIntervalSec;
        this._pluginContextHolder = pluginContextHolder;
        this._logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.portal.remoteAppRegistry');
        this._timeout = null;
    }

    start() {
        this.runASAP();
    }

    stop() {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
    }

    runASAP() {
        this.stop();
        this._timeout = setTimeout(() => this._processInBackground(), 2000);
    }

    async _processInBackground() {
        this._logger.info('Start processing remote portal app endpoints');
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this._pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint.service;
        const endpoints: Array<RemotePortalAppEndpoint> = await portalRemoteAppEndpointService.findAll();

        for (const remotePortalAppEndpoint of endpoints) {
            const registrationTimestamp = remotePortalAppEndpoint.registrationTimestamp;
            const unregisteredApps = remotePortalAppEndpoint.portalApps.some((remoteApp) => !context.registry.portalApps.find((registeredApp) => registeredApp.name === remoteApp.name));
            if (unregisteredApps || remotePortalAppEndpoint.lastError || !registrationTimestamp || Date.now() - registrationTimestamp > this._registrationRefreshIntervalSec * 1000) {
                await this.refreshEndpointRegistration(remotePortalAppEndpoint);
            }
        }

        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(() => this._processInBackground(), this._checkIntervalSec * 1000);
    }

    async refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint) {
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this._pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint.service;

        let updatedEndpoint = await this.fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint);

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

    async fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint) {
        this._logger.info(`Fetching remote endpoint data from URL: ${remotePortalAppEndpoint.url}`);

        try {
            const packageJson = await this._loadPackageJson(remotePortalAppEndpoint);

            const portalApps = this._processPackageJson(packageJson, remotePortalAppEndpoint);
            return {
                ...remotePortalAppEndpoint, lastError: null,
                retries: 0,
                registrationTimestamp: Date.now(),
                portalApps
            };

        } catch (error) {
            this._logger.error('Processing remote portal app endpoint failed!', error);

            return {
                ...remotePortalAppEndpoint, lastError: error.message,
                retries: remotePortalAppEndpoint.retries + 1,
                registrationTimestamp: null,
                portalApps: []
            };
        }
    }

    _processPackageJson(packageJson: any, remotePortalAppEndpoint: RemotePortalAppEndpoint): Array<MashroomPortalApp> {
        this._logger.debug(`Processing package.json of remote portal app endpoint: ${remotePortalAppEndpoint.url}`, packageJson);

        if (!packageJson || !packageJson.mashroom) {
            throw new Error(`No mashroom property found in package.json of remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const mashroomDef: MashroomPluginPackageDefinition = packageJson.mashroom;
        const portalAppDefinitions = mashroomDef.plugins.filter((plugin) => plugin.type === 'portal-app');

        if (portalAppDefinitions.length === 0) {
            throw new Error(`No plugin of type portal-app found in remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const portalApps = portalAppDefinitions.map((definition) => this._mapPluginDefinition(packageJson, definition, remotePortalAppEndpoint));

        return portalApps.map((portalApp) => {
            const existingApp = remotePortalAppEndpoint.portalApps.find((existingApp) => existingApp.name === portalApp.name);
            if (existingApp && existingApp.version === portalApp.version) {
                // Keep reload timestamp for browser caching
                return {...portalApp, lastReloadTs: existingApp.lastReloadTs};
            }

            return portalApp;
        });
    }

    _mapPluginDefinition(packageJson: any, definition: MashroomPluginDefinition, remotePortalAppEndpoint: RemotePortalAppEndpoint): MashroomPortalApp {

        const name = definition.name;
        if (!name) {
            throw new Error(`Invalid portal app definition: No 'name' attribute! Remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
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
                    const parsedUri = url.parse(targetUri);
                    if (parsedUri.hostname === 'localhost') {
                        targetUri = remotePortalAppEndpoint.url + (parsedUri.path && parsedUri.path !== '/' ? parsedUri.path : '');
                    }
                    restProxies[proxyName] = {...definedRestProxies[proxyName], targetUri};
                }
            }
        }

        const portalApp: MashroomPortalApp = {
            name,
            title: definition.title,
            description: definition.description || packageJson.description,
            tags: definition.tags || [],
            version: packageJson.version,
            homepage: definition.homepage || packageJson.homepage,
            author: definition.author || packageJson.author,
            license: packageJson.license,
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

    async _loadPackageJson(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<any> {
        const requestOptions = {
            url: `${remotePortalAppEndpoint.url}/package.json`,
            followRedirect: false,
            timeout: this._socketTimeoutSec * 1000,
        };

        return new Promise((resolve, reject) => {
            request.get(requestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const packageJson = JSON.parse(body);
                    resolve(packageJson);
                } catch (parseError) {
                    reject(new Error(`Parsing /package.json failed! Did you forget to expose it? \n${parseError.message}`));
                }
            });
        });
    }


}
