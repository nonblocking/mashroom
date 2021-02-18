
import {URL} from 'url';
import request from 'request';
import {evaluateTemplatesInConfigObject} from '@mashroom/mashroom-utils/lib/config_utils';
import context from '../context';

import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPluginDefinition,
    MashroomPluginPackageDefinition
} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalApp, MashroomPortalProxyDefinitions} from '@mashroom/mashroom-portal/type-definitions';
import type {KubernetesConnector, KubernetesService, ScanBackgroundJob} from '../../../type-definitions';

export default class ScanK8SPortalRemoteAppsBackgroundJob implements ScanBackgroundJob {

    private _timeout?: NodeJS.Timeout;
    private _serviceNameFilter: RegExp;
    private _logger: MashroomLogger;

    constructor(private _k8sNamespaces: Array<string>, serviceNameFilterStr: string, private _socketTimeoutSec: number,
                private _scanPeriodSec: number, private _refreshIntervalSec: number, private _accessViaClusterIP: boolean,
                private _kubernetesConnector: KubernetesConnector, loggerFactory: MashroomLoggerFactory) {
        this._serviceNameFilter = new RegExp(serviceNameFilterStr, 'i');
        this._logger = loggerFactory('mashroom.portal.remoteAppRegistryK8s');
    }

    start(): void {
        this._kubernetesConnector.init();
        this._scanKubernetesServices();
        this._timeout = setInterval(() => this._scanKubernetesServices(), this._scanPeriodSec * 1000);
    }

    stop(): void {
        if (this._timeout) {
            clearInterval(this._timeout);
        }
    }

    private async _scanKubernetesServices(): Promise<void> {
        this._logger.info('Starting scan of k8s namespaces: ', this._k8sNamespaces);
        context.lastScan = Date.now();
        context.error = null;

        for (let i = 0; i < this._k8sNamespaces.length; i++) {
            const namespace = this._k8sNamespaces[i];
            try {
                const res = await this._kubernetesConnector.listNamespaceServices(namespace);
                const serviceItems = res.items;

                for (let j = 0; j < serviceItems.length; j++) {
                    const serviceItem = serviceItems[j];

                    const name = serviceItem?.metadata?.name;
                    if (name && name.match(this._serviceNameFilter)) {
                        const existingService = context.registry.getService(name);
                        const ip = serviceItem?.spec?.clusterIP;
                        const ports = serviceItem?.spec?.ports;
                        const port = ports && ports.length > 0 ? ports[0].port : undefined;
                        const headlessService = !port || !ip || ip.toLowerCase() === 'none';
                        let service: KubernetesService | undefined;

                        if (existingService) {
                            if (existingService.status === 'Error' || existingService.lastCheck < Date.now() - this._refreshIntervalSec * 1000) {
                                service = {
                                    ...existingService, status: 'Checking',
                                    lastCheck: Date.now(),
                                    error: null,
                                }
                            }
                        } else {
                            const url = this._accessViaClusterIP ? `http://${ip}:${port}` : `http://${name}.${namespace}:${port}`;
                            this._logger.info(`Adding new Kubernetes service: ${name} (${url})`);

                            service = {
                                name,
                                namespace,
                                ip,
                                port,
                                url,
                                firstSeen: Date.now(),
                                status: 'Checking',
                                lastCheck: Date.now(),
                                error: null,
                                foundPortalApps: []
                            };
                        }

                        if (service) {
                            if (this._accessViaClusterIP && headlessService) {
                                service = {
                                    ...service, status: 'Headless Service',
                                    foundPortalApps: []
                                };
                                context.registry.addOrUpdateService(service);
                            } else {
                                context.registry.addOrUpdateService(service);
                                await this._checkServiceForRemotePortalApps(service);
                                context.registry.addOrUpdateService(service);
                            }
                        }
                    }
                }
            } catch (error) {
                this._logger.error(`Error during scan of k8s namespace: ${namespace}`, error);
                context.error = error.message;
            }
        }

        this._removeAppsNotSeenForALongTime();
    }

    private async _checkServiceForRemotePortalApps(service: KubernetesService): Promise<void> {
        this._logger.debug('Checking service:', service);

        let packageJson;
        let portalApps;

        try {
            const {found, json} = await this._loadPackageJson(service.url);
            if (found) {
                packageJson = json;
            } else {
                service.foundPortalApps = [];
                service.status = 'No Descriptor';
                return;
            }
        } catch (error) {
            service.status = 'Error';
            service.error = error.message;
            service.foundPortalApps = [];
            this._logger.error(`Error checking Kubernetes service ${service.name} failed!`, error);
            return;
        }

        try {
            portalApps = this.processPackageJson(packageJson, service.url, service.name);
            this._logger.info(`Registered portal apps for Kubernetes service: ${service.name}:`, portalApps);
        } catch (error) {
            service.status = 'Error';
            service.error = error.message;
            service.foundPortalApps = [];
            this._logger.error(`Processing remote portal app info for Kubernetes service ${service.name} failed!`, error);
            return;
        }

        service.status = 'Valid';
        service.foundPortalApps = portalApps;
    }

    private async _loadPackageJson(serviceUrl: string): Promise<{ found: boolean; json?: any }> {
        const requestOptions = {
            url: `${serviceUrl}/package.json`,
            followRedirect: false,
            timeout: this._socketTimeoutSec * 1000,
        };

        return new Promise((resolve, reject) => {
            request.get(requestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (response.statusCode === 404) {
                    resolve({found: false});
                    return;
                }
                if (response.statusCode !== 200) {
                    reject(new Error(`Received HTTP Code: ${response.statusCode}`));
                    return;
                }

                try {
                    const json = JSON.parse(body);
                    resolve({found: true, json});
                } catch (parseError) {
                    reject(new Error(`Parsing /package.json failed!\n${parseError.message}`));
                }
            });
        });
    }

    processPackageJson(packageJson: any, serviceUrl: string, serviceName: string): Array<MashroomPortalApp> {
        this._logger.debug(`Processing package.json of Kubernetes service: ${serviceName}`, packageJson);

        if (!packageJson || !packageJson.mashroom) {
            throw new Error('No mashroom property found in package.json');
        }

        const mashroomDef: MashroomPluginPackageDefinition = packageJson.mashroom;
        const portalAppDefinitions = mashroomDef.plugins.filter((plugin) => plugin.type === 'portal-app');

        if (portalAppDefinitions.length === 0) {
            throw new Error('No plugin of type portal-app found in remote portal app');
        }

        return portalAppDefinitions.map((definition) => this._mapPluginDefinition(packageJson, definition, serviceUrl));
    }

    private _mapPluginDefinition(packageJson: any, definition: MashroomPluginDefinition, serviceUrl: string): MashroomPortalApp {
        const name = definition.name;
        if (!name) {
            throw new Error('Invalid portal app definition: No "name" attribute!');
        }

        const globalLaunchFunction = definition.bootstrap;
        if (!globalLaunchFunction) {
            throw new Error('Invalid configuration of plugin ${name}: No bootstrap function defined.');
        }

        const resourcesDef = definition.resources;
        if (!resourcesDef) {
            throw new Error('Invalid configuration of plugin ${name}: No resources defined.');
        }

        const resources = {
            js: resourcesDef.js,
            css: resourcesDef.css,
        };
        if (!resources.js) {
            throw new Error('Invalid configuration of plugin ${name}: No resources.js defined.');
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
                if (Object.prototype.hasOwnProperty.call(definedRestProxies, proxyName)) {
                    let targetUri = definedRestProxies[proxyName].targetUri;
                    const parsedUri = new URL(targetUri);
                    if (parsedUri.hostname === 'localhost') {
                        targetUri = serviceUrl + (parsedUri.pathname && parsedUri.pathname !== '/' ? parsedUri.pathname : '');
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
            resourcesRootUri: serviceUrl,
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

    private _removeAppsNotSeenForALongTime(): void {
        context.registry.services.forEach((service) => {
            if (service.lastCheck < Date.now() - this._refreshIntervalSec * 1000 * 2.5) {
                // Not seen for 2.5 check intervals
                this._logger.info(`Removing portal apps because Kubernetes service ${service.name} is no longer available:`, service.foundPortalApps);
                context.registry.removeService(service.name);
            }
        });
    }

}
