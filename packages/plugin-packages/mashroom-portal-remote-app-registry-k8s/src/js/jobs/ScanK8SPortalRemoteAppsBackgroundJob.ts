
import {KubeConfig, CoreV1Api} from '@kubernetes/client-node';
import url from 'url';
import request from 'request';
import context from '../context';

import {
    MashroomLogger,
    MashroomLoggerFactory, MashroomPluginDefinition,
    MashroomPluginPackageDefinition
} from "@mashroom/mashroom/type-definitions";
import {MashroomPortalApp, MashroomPortalProxyDefinitions} from "@mashroom/mashroom-portal/type-definitions";
import {KubernetesService, ScanBackgroundJob} from "../../../type-definitions";

export default class ScanK8SPortalRemoteAppsBackgroundJob implements ScanBackgroundJob {

    private k8sApi?: CoreV1Api;
    private timeout?: NodeJS.Timeout;
    private readonly serviceNameFilter: RegExp;
    private readonly logger: MashroomLogger;

    constructor(private k8sNamespaces: Array<string>, serviceNameFilterStr: string, private scanPeriodSec: number, private refreshIntervalSec: number, private accessViaClusterIP: boolean, loggerFactory: MashroomLoggerFactory) {
        this.serviceNameFilter = new RegExp(serviceNameFilterStr);
        this.logger = loggerFactory('mashroom.portal.remoteAppRegistryK8s');
    }

    start(): void {
        if (!this.k8sApi) {
            this.setupK8sApi();
        }
        this.scanKubernetesServices();
        this.timeout = setInterval(() => this.scanKubernetesServices(), this.scanPeriodSec * 1000);
    }

    stop(): void {
        if (this.timeout) {
            clearInterval(this.timeout);
        }
    }

    private setupK8sApi(): void {
        const k8sClient = new KubeConfig();
        // This only works if the Portal runs within a Kubernetes Pod with a valid service account attached
        k8sClient.loadFromCluster();
        this.k8sApi = k8sClient.makeApiClient(CoreV1Api);
    }

    private async scanKubernetesServices(): Promise<void> {
        if (!this.k8sApi) {
            return;
        }

        this.logger.info('Starting scan of k8s namespaces: ', this.k8sNamespaces);
        context.lastScan = Date.now();
        context.error = null;

        for (let i = 0; i < this.k8sNamespaces.length; i++) {
            const namespace = this.k8sNamespaces[i];
            try {
                const res = await this.k8sApi.listNamespacedService(namespace);
                const serviceItems = res.body.items;

                for (let j = 0; j < serviceItems.length; j++) {
                    const serviceItem = serviceItems[j];

                    const name = serviceItem?.metadata?.name;
                    const ip = serviceItem?.spec?.clusterIP;
                    const ports = serviceItem?.spec?.ports;
                    const port = ports && ports.length > 0 ? ports[0].port : undefined;

                    if (name && ip && ip.toLowerCase() !== 'none' && port && port && name.match(this.serviceNameFilter)) {
                        let service: KubernetesService | null = null;
                        const existingService = context.registry.getService(name);
                        if (existingService) {
                            if (existingService.error || existingService.lastCheck < Date.now() - this.refreshIntervalSec * 1000) {
                                service = Object.assign({}, existingService, {
                                    lastCheck: Date.now(),
                                    error: null,
                                })
                            }
                        } else {
                            const url = this.accessViaClusterIP ? `http://${ip}:${port}` : `http://${name}.${namespace}:${port}`;

                            service = {
                                name,
                                namespace,
                                ip,
                                port,
                                url,
                                firstSeen: Date.now(),
                                lastCheck: Date.now(),
                                error: null,
                                descriptorFound: false,
                                foundPortalApps: []
                            };
                        }

                        if (service) {
                            await this.checkServiceForRemotePortalApps(service);
                            context.registry.addOrUpdateService(service);
                        }
                    }
                }
            } catch (error) {
                this.logger.error(`Error during scan of k8s namespace: ${namespace}`, error)
                context.error = error;
            }
        }
    }

    private async checkServiceForRemotePortalApps(service: KubernetesService): Promise<void> {
        this.logger.debug('Checking service:', service);

        let packageJson;
        let portalApps;

        try {
            packageJson = await this.loadPackageJson(service.url);
            service.descriptorFound = true;
        } catch (error) {
            service.descriptorFound = false;
            this.logger.debug(`Fetching remote portal app info for Kubernetes service ${service.name} failed!`);
            return;
        }

        try {
            portalApps = this.processPackageJson(packageJson, service.url, service.name);
        } catch (error) {
            this.logger.error(`Processing remote portal app info for Kubernetes service ${service.name} failed!`, error);
            service.error = error.message;
            return;
        }

        service.foundPortalApps = portalApps;
    }

    private async loadPackageJson(serviceUrl: string): Promise<any> {
        return new Promise((resolve, reject) => {
            request.get({ url: `${serviceUrl}/package.json` }, (error, response, body) => {
                if (error) {
                    reject(new Error('No package.json found!'));
                    return;
                }

                try {
                    const packageJson = JSON.parse(body);
                    resolve(packageJson);
                } catch (parseError) {
                    reject(new Error('Parsing /package.json failed!\n' + parseError.message));
                }
            });
        });
    }

    processPackageJson(packageJson: any, serviceUrl: string, serviceName: string): Array<MashroomPortalApp> {
        this.logger.debug(`Processing package.json of Kubernetes service: ${serviceName}`, packageJson);

        if (!packageJson || !packageJson.mashroom) {
            throw new Error(`No mashroom property found in package.json of Kubernetes service: ${serviceName}`);
        }

        const mashroomDef: MashroomPluginPackageDefinition = packageJson.mashroom;
        const portalAppDefinitions = mashroomDef.plugins.filter((plugin) => plugin.type === 'portal-app');

        if (portalAppDefinitions.length === 0) {
            throw new Error(`No plugin of type portal-app found in remote portal app of Kubernetes service: ${serviceName}`);
        }

        return portalAppDefinitions.map((definition) => this.mapPluginDefinition(packageJson, definition, serviceUrl, serviceName));
    }

    private mapPluginDefinition(packageJson: any, definition: MashroomPluginDefinition, serviceUrl: string, serviceName: string): MashroomPortalApp {

        const name = definition.name;
        if (!name) {
            throw new Error(`Invalid portal app definition: No 'name' attribute! Kubernetes service: ${serviceName}`);
        }

        const globalLaunchFunction = definition.bootstrap;
        if (!globalLaunchFunction) {
            throw new Error(`Invalid configuration of plugin ${name}: No bootstrap function defined. Kubernetes service: ${serviceName}`);
        }

        const resourcesDef = definition.resources;
        if (!resourcesDef) {
            throw new Error(`Invalid configuration of plugin ${name}: No resources defined. Kubernetes service: ${serviceName}`);
        }

        const resources = {
            js: resourcesDef.js,
            css: resourcesDef.css,
        };
        if (!resources.js) {
            throw new Error(`Invalid configuration of plugin ${name}: No resources.js defined. Kubernetes service: ${serviceName}`);
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
                        targetUri = serviceUrl + (parsedUri.path && parsedUri.path !== '/' ? parsedUri.path : '');
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
}
