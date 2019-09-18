// @flow
/* eslint no-unused-vars: off */

import url from 'url';
import request from 'request';
import {registry} from '../context';

import type {
    MashroomLogger,
    MashroomPluginContextHolder,
    MashroomPluginDefinition,
    MashroomPluginPackageDefinition
} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalApp, MashroomPortalProxyDefinitions} from '@mashroom/mashroom-portal/type-definitions';
import type {
    MashroomPortalRemoteAppEndpointService,
    RegisterPortalRemoteAppsBackgroundJob as RegisterPortalRemoteAppsBackgroundJobType,
    RemotePortalAppEndpoint
} from '../../../type-definitions';

const RUN_INTERVAL_MS = 30 * 1000; // 30 sec

export default class RegisterPortalRemoteAppsBackgroundJob implements RegisterPortalRemoteAppsBackgroundJobType {

    _registrationRefreshIntervalSec: number;
    _removeAfterNumberOrRetries: number;
    _pluginContextHolder: MashroomPluginContextHolder;
    _logger: MashroomLogger;
    _timeout: ?TimeoutID;

    constructor(registrationRefreshIntervalSec: number, removeAfterNumberOrRetries: number, pluginContextHolder: MashroomPluginContextHolder) {
        this._registrationRefreshIntervalSec = registrationRefreshIntervalSec;
        this._removeAfterNumberOrRetries = removeAfterNumberOrRetries;
        this._pluginContextHolder = pluginContextHolder;
        this._logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.portal.remoteAppRegistry');
        this._timeout = null;
    }

    start() {
        this.runASAP();
    }

    runASAP() {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(() => this._processInBackground(), 2000);
    }

    async _processInBackground() {
        this._logger.info('Start processing remote portal app endpoints');
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this._pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint.service;
        const endpoints: Array<RemotePortalAppEndpoint> = await portalRemoteAppEndpointService.findAll();

        for (const remotePortalAppEndpoint of endpoints) {
            const registrationTimestamp = remotePortalAppEndpoint.registrationTimestamp;
            const unregisteredApps = remotePortalAppEndpoint.portalApps.some((remoteApp) => !registry.portalApps.find((registeredApp) => registeredApp.name === remoteApp.name));
            if (unregisteredApps || remotePortalAppEndpoint.lastError || !registrationTimestamp || Date.now() - registrationTimestamp > this._registrationRefreshIntervalSec * 1000) {
                await this.refreshEndpointRegistration(remotePortalAppEndpoint);
            }
        }

        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(() => this._processInBackground(), RUN_INTERVAL_MS);
    }

    async refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint) {
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this._pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint.service;

        let updatedEndpoint = await this.fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint);

        if (!updatedEndpoint.lastError) {
            updatedEndpoint.portalApps.forEach((portalApp) => {
                this._logger.info('Registering remote portal app:', {portalApp});
                registry.registerRemotePortalApp(portalApp)
            });
        } else {
            this._logger.error(`Registering apps for remote portal apps failed: ${remotePortalAppEndpoint.url}. # retries: ${remotePortalAppEndpoint.retries} of ${this._removeAfterNumberOrRetries}`);
        }

        if (updatedEndpoint.lastError && updatedEndpoint.retries >= this._removeAfterNumberOrRetries) {
            this._logger.warn(`Removing remote portal app endpoint after ${updatedEndpoint.retries} retries: ${remotePortalAppEndpoint.url}`);
            await portalRemoteAppEndpointService.unregisterRemoteAppUrl(remotePortalAppEndpoint.url);
        } else {
            await portalRemoteAppEndpointService.updateRemotePortalAppEndpoint(updatedEndpoint);
        }
    }

    async fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint) {
        this._logger.info(`Fetching remote endpoint data from URL: ${remotePortalAppEndpoint.url}`);

        try {
            const packageJson = await this._loadPackageJson(remotePortalAppEndpoint);

            const portalApps = this._processPackageJson(packageJson, remotePortalAppEndpoint);
            return Object.assign({}, remotePortalAppEndpoint, {
                lastError: null,
                retries: 0,
                registrationTimestamp: Date.now(),
                portalApps
            });

        } catch (error) {
            this._logger.error('Processing remote portal app endpoint failed!', error);

            return Object.assign({}, remotePortalAppEndpoint, {
                lastError: error.message,
                retries: remotePortalAppEndpoint.retries + 1,
                registrationTimestamp: null,
                portalApps: []
            });
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

        const mergedPortalApps = portalApps.map((portalApp) => {
           const existingApp = remotePortalAppEndpoint.portalApps.find((existingApp) => existingApp.name === portalApp.name);
           if (existingApp && existingApp.version === portalApp.version) {
               // Keep reload timestamp for browser caching
               return Object.assign({}, portalApp, {
                   lastReloadTs: existingApp.lastReloadTs
               });
           }

           return portalApp;
        });

        return mergedPortalApps;
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

        const globalResourcesDef = definition.globalResources;
        let globalResources = null;
        if (globalResourcesDef) {
            globalResources = {
                js: globalResourcesDef.js,
                css: globalResourcesDef.css,
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
                    restProxies[proxyName] = Object.assign({}, definedRestProxies[proxyName], {
                        targetUri
                    });
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
            resources,
            globalResources,
            screenshots,
            defaultRestrictViewToRoles,
            rolePermissions: config.rolePermissions,
            restProxies,
            defaultAppConfig: config.appConfig
        };

        return portalApp;
    }

    async _loadPackageJson(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<any> {
        return new Promise((resolve, reject) => {
            request.get({ url: `${remotePortalAppEndpoint.url}/package.json` }, (error, response, body) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const packageJson = JSON.parse(body);
                    resolve(packageJson);
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });
    }


}
