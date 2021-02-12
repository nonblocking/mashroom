
import url from 'url';
import request from 'request';
// @ts-ignore
import {evaluateTemplatesInConfigObject} from '@mashroom/mashroom-utils/lib/config_utils';
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

    private logger: MashroomLogger;
    private timeout: ReturnType<typeof setTimeout> | null;

    constructor(private socketTimeoutSec: number, private checkIntervalSec: number,
                private registrationRefreshIntervalSec: number, private pluginContextHolder: MashroomPluginContextHolder) {
        this.logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.portal.remoteAppRegistry');
        this.timeout = null;
    }

    start(): void {
        this.runASAP();
    }

    stop(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    runASAP(): void {
        this.stop();
        this.timeout = setTimeout(() => this.processInBackground(), 2000);
    }

    async processInBackground(): Promise<void> {
        this.logger.info('Start processing remote portal app endpoints');
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this.pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint.service;
        const endpoints = await portalRemoteAppEndpointService.findAll();

        for (const remotePortalAppEndpoint of endpoints) {
            const registrationTimestamp = remotePortalAppEndpoint.registrationTimestamp;
            const unregisteredApps = remotePortalAppEndpoint.portalApps.some((remoteApp) => !context.registry.portalApps.find((registeredApp) => registeredApp.name === remoteApp.name));
            if (unregisteredApps || remotePortalAppEndpoint.lastError || !registrationTimestamp || Date.now() - registrationTimestamp > this.registrationRefreshIntervalSec * 1000) {
                await this.refreshEndpointRegistration(remotePortalAppEndpoint);
            }
        }

        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => this.processInBackground(), this.checkIntervalSec * 1000);
    }

    async refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void> {
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = this.pluginContextHolder.getPluginContext().services.remotePortalAppEndpoint.service;

        const updatedEndpoint = await this.fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint);

        if (!updatedEndpoint.lastError) {
            updatedEndpoint.portalApps.forEach((portalApp) => {
                this.logger.info('Registering remote portal app:', {portalApp});
                context.registry.registerRemotePortalApp(portalApp)
            });
        } else {
            this.logger.error(`Registering apps for remote portal apps failed: ${remotePortalAppEndpoint.url}. # retries: ${remotePortalAppEndpoint.retries}`);
            remotePortalAppEndpoint.portalApps.forEach((portalApp) => {
                this.logger.info('Unregister remote portal app:', {portalApp});
                context.registry.unregisterRemotePortalApp(portalApp.name)
            });
        }

        await portalRemoteAppEndpointService.updateRemotePortalAppEndpoint(updatedEndpoint);
    }

    async fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<RemotePortalAppEndpoint> {
        this.logger.info(`Fetching remote endpoint data from URL: ${remotePortalAppEndpoint.url}`);

        try {
            const packageJson = await this.loadPackageJson(remotePortalAppEndpoint);

            const portalApps = this.processPackageJson(packageJson, remotePortalAppEndpoint);
            return {
                ...remotePortalAppEndpoint, lastError: null,
                retries: 0,
                registrationTimestamp: Date.now(),
                portalApps
            };

        } catch (error) {
            this.logger.error('Processing remote portal app endpoint failed!', error);

            return {
                ...remotePortalAppEndpoint, lastError: error.message,
                retries: remotePortalAppEndpoint.retries + 1,
                registrationTimestamp: null,
                portalApps: []
            };
        }
    }

    private processPackageJson(packageJson: any, remotePortalAppEndpoint: RemotePortalAppEndpoint): Array<MashroomPortalApp> {
        this.logger.debug(`Processing package.json of remote portal app endpoint: ${remotePortalAppEndpoint.url}`, packageJson);

        if (!packageJson || !packageJson.mashroom) {
            throw new Error(`No mashroom property found in package.json of remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const mashroomDef: MashroomPluginPackageDefinition = packageJson.mashroom;
        const portalAppDefinitions = mashroomDef.plugins.filter((plugin) => plugin.type === 'portal-app');

        if (portalAppDefinitions.length === 0) {
            throw new Error(`No plugin of type portal-app found in remote portal app endpoint: ${remotePortalAppEndpoint.url}`);
        }

        const portalApps = portalAppDefinitions.map((definition) => this.mapPluginDefinition(packageJson, definition, remotePortalAppEndpoint));

        return portalApps.map((portalApp) => {
            const existingApp = remotePortalAppEndpoint.portalApps.find((existingApp) => existingApp.name === portalApp.name);
            if (existingApp && existingApp.version === portalApp.version) {
                // Keep reload timestamp for browser caching
                return {...portalApp, lastReloadTs: existingApp.lastReloadTs};
            }

            return portalApp;
        });
    }

    mapPluginDefinition(packageJson: any, definition: MashroomPluginDefinition, remotePortalAppEndpoint: RemotePortalAppEndpoint): MashroomPortalApp {
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
        evaluateTemplatesInConfigObject(config, this.logger);
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

    private async loadPackageJson(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<any> {
        const requestOptions = {
            url: `${remotePortalAppEndpoint.url}/package.json`,
            followRedirect: false,
            timeout: this.socketTimeoutSec * 1000,
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
