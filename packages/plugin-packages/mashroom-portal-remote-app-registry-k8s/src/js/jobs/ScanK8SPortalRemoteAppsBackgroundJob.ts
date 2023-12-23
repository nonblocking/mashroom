
import {URL} from 'url';
import fetch from 'node-fetch';
import {configUtils} from '@mashroom/mashroom-utils';
import context from '../context';

import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPluginDefinition,
    MashroomPluginPackageDefinition
} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalApp, MashroomPortalProxyDefinitions} from '@mashroom/mashroom-portal/type-definitions';
import type {KubernetesConnector, KubernetesService, ScanBackgroundJob, KubernetesServiceInvalidPortalApp} from '../../../type-definitions';

type ServicePortalApps = {
    readonly foundPortalApps: Array<MashroomPortalApp>;
    readonly invalidPortalApps: Array<KubernetesServiceInvalidPortalApp>;
}

export default class ScanK8SPortalRemoteAppsBackgroundJob implements ScanBackgroundJob {

    private _serviceNameFilter: RegExp;
    private _logger: MashroomLogger;

    constructor(private _k8sNamespacesLabelSelector: string | Array<string> | null | undefined, private _k8sNamespaces: Array<string> | null | undefined,
                private _k8sServiceLabelSelector: string | Array<string> | null | undefined, serviceNameFilterStr: string | null | undefined,
                private _socketTimeoutSec: number, private _refreshIntervalSec: number, private _unregisterAppsAfterScanErrors: number, private _accessViaClusterIP: boolean,
                private _externalPluginConfigFileNames: Array<string>,
                private _kubernetesConnector: KubernetesConnector, loggerFactory: MashroomLoggerFactory) {
        this._serviceNameFilter = new RegExp(serviceNameFilterStr || '.*', 'i');
        this._logger = loggerFactory('mashroom.portal.remoteAppRegistryK8s');
    }

    run(): void {
        try {
            this._scanKubernetesServices();
        } finally {
            context.oneFullScanDone = true;
        }
    }

    async _scanKubernetesServices(): Promise<void> {
        context.lastScan = Date.now();
        context.errors = [];

        const namespaces = await this._determineNamespaces();
        context.namespaces = namespaces;
        const namespaceScanFailures = context.errors.length > 0;
        const namespaceServiceScanFailures: Array<string> = [];

        const foundServices: Array<{ name: string, namespace: string }> = [];

        this._logger.info('Starting scan of k8s namespaces: ', namespaces);

        for (let nsIdx = 0; nsIdx < namespaces.length; nsIdx++) {
            const namespace = namespaces[nsIdx];
            let labelSelectors: Array<string | undefined> = [undefined];
            if (this._k8sServiceLabelSelector) {
                labelSelectors = Array.isArray(this._k8sServiceLabelSelector) ? this._k8sServiceLabelSelector : [this._k8sServiceLabelSelector];
            }

            for (let serviceSelectorIdx = 0; serviceSelectorIdx < labelSelectors.length; serviceSelectorIdx++) {
                const labelSelector = labelSelectors[serviceSelectorIdx];
                try {
                    const res = await this._kubernetesConnector.getNamespaceServices(namespace, labelSelector);
                    const serviceItems = res.items;
                    const priority = (nsIdx + 1000) * (serviceSelectorIdx + 1);

                    for (let j = 0; j < serviceItems.length; j++) {
                        const serviceItem = serviceItems[j];

                        const name = serviceItem?.metadata?.name;
                        if (name && name.match(this._serviceNameFilter)) {
                            foundServices.push({ name, namespace });
                            const existingService = context.registry.getService(namespace, name);
                            const ip = serviceItem?.spec?.clusterIP;
                            const ports = serviceItem?.spec?.ports;
                            const port = ports && ports.length > 0 ? ports[0].port : undefined;
                            const headlessService = !port || !ip || ip.toLowerCase() === 'none';
                            let service: KubernetesService | undefined;

                            if (existingService) {
                                if (existingService.status === 'Error' || existingService.invalidPortalApps.length > 0 || existingService.lastCheck < Date.now() - this._refreshIntervalSec * 1000 || existingService.port !== port) {
                                    const url = this._accessViaClusterIP ? `http://${ip}:${port}` : `http://${name}.${namespace}:${port}`;
                                    service = {
                                        ...existingService,
                                        priority,
                                        status: 'Checking',
                                        lastCheck: Date.now(),
                                        error: null,
                                        port,
                                        url,
                                    };
                                }
                            } else {
                                const url = this._accessViaClusterIP ? `http://${ip}:${port}` : `http://${name}.${namespace}:${port}`;
                                this._logger.info(`Adding new Kubernetes service: ${name} (${url})`);

                                service = {
                                    name,
                                    namespace,
                                    priority,
                                    ip,
                                    port,
                                    url,
                                    firstSeen: Date.now(),
                                    status: 'Checking',
                                    lastCheck: Date.now(),
                                    error: null,
                                    retries: 0,
                                    foundPortalApps: [],
                                    invalidPortalApps: [],
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
                } catch (error: any) {
                    namespaceServiceScanFailures.push(namespace);
                    context.errors.push(`Error scanning services in namespace ${namespace} with label selector ${labelSelector}: ${error.message}`);
                    this._logger.error(`Error scanning services in namespace ${namespace} with label selector ${labelSelector}`, error);
                }
            }
        }

        // Remove services that no longer exist, but only if the K8S API calls didn't fail
        const missingServices = context.registry.services.filter(({name, namespace}) => !foundServices.find((s) => s.namespace === namespace && s.name === name));
        missingServices.forEach(({name, namespace}) => {
            const serviceNamespaceRemoved = !namespaceScanFailures && namespaces.indexOf(namespace) === -1;
            const serviceRemoved = namespaceServiceScanFailures.indexOf(namespace) === -1;
            if (serviceNamespaceRemoved || serviceRemoved) {
                context.registry.removeService(namespace, name);
            }
        });
    }

    private async _determineNamespaces(): Promise<Array<string>> {
        const namespaces: Array<string> = [];
        if (this._k8sNamespacesLabelSelector) {
            try {
                const labelSelectors: Array<string> = Array.isArray(this._k8sNamespacesLabelSelector) ? this._k8sNamespacesLabelSelector : [this._k8sNamespacesLabelSelector];
                for (const labelSelector of labelSelectors) {
                    const additionalNamespaces = await this._kubernetesConnector.getNamespacesByLabel(labelSelector);
                    additionalNamespaces.items.forEach((ns) => {
                        if (ns.metadata?.name && namespaces.indexOf(ns.metadata.name) === -1) {
                            namespaces.push(ns.metadata.name);
                        }
                    });
                }
            } catch (e: any) {
                context.errors.push(`Error scanning namespaces in cluster: ${e.message}`);
                this._logger.error(`Error scanning namespaces with label selector: ${this._k8sNamespacesLabelSelector}`, e);
            }
        }
        if (Array.isArray(this._k8sNamespaces)) {
            this._k8sNamespaces.forEach((ns) => {
                if (namespaces.indexOf(ns) == -1) {
                    namespaces.push(ns);
                }
            });
        }
        this._logger.debug('Determined namespaces to scan:', namespaces.join(', '));
        return namespaces;
    }

    private async _checkServiceForRemotePortalApps(service: KubernetesService): Promise<void> {
        this._logger.debug('Checking service:', service);

        try {
            const externalPluginDefinition = await this._loadExternalPluginDefinition(service.url);
            const packageJson = await this._loadPackageJson(service.url);

            const {foundPortalApps, invalidPortalApps} = this.processPluginDefinition(packageJson, externalPluginDefinition, service);
            this._logger.info(`Registering Portal Apps for Kubernetes service: ${service.name}:`, foundPortalApps);
            service.status = 'Valid';
            service.error = null;
            service.retries = 0;
            service.foundPortalApps = foundPortalApps;
            service.invalidPortalApps = invalidPortalApps;
        } catch (error: any) {
            this._logger.error(`Processing remote Portal App info for Kubernetes service ${service.name} failed! Retry: ${service.retries}`, error);

            const removeRegisteredApps = this._unregisterAppsAfterScanErrors > -1 && service.retries >= this._unregisterAppsAfterScanErrors;
            service.status = 'Error';
            service.error = error.message;
            service.retries ++;
            if (removeRegisteredApps) {
                service.foundPortalApps = [];
                service.invalidPortalApps = [];
            }
        }
    }

    private async _loadPackageJson(serviceUrl: string): Promise<any | null> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(),  this._socketTimeoutSec * 1000);
        try {
            const result = await fetch(`${serviceUrl}/package.json`, {
                signal: controller.signal,
            });
            if (result.ok) {
                return await result.json();
            } else {
                this._logger.warn(`Fetching package.json from ${serviceUrl} failed with status code ${result.status}`);
            }
        } catch (e) {
            this._logger.warn(`Fetching package.json from ${serviceUrl} failed`, e);
        } finally {
            clearTimeout(timeout);
        }
        return null;
    }

    private async _loadExternalPluginDefinition(serviceUrl: string): Promise<MashroomPluginPackageDefinition | null> {
        const promises = this._externalPluginConfigFileNames.map(async (name) => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(),  this._socketTimeoutSec * 1000);
                const result = await fetch(`${serviceUrl}/${name}.json`, {
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                if (result.ok) {
                    const json = result.json();
                    this._logger.debug(`Fetched plugin definition ${name}.json from ${serviceUrl}`);
                    return json;
                } else {
                    this._logger.debug(`Fetching ${name}.json from ${serviceUrl} failed with status code ${result.status}`);
                }
            } catch (e) {
                this._logger.debug(`Fetching ${name}.json from ${serviceUrl} failed`, e);
            }
        });

        const configs = await Promise.all(promises);
        return configs.find((c) => !!c) as MashroomPluginPackageDefinition || null;
    }

    processPluginDefinition(packageJson: any | null, definition: MashroomPluginPackageDefinition | null, service: KubernetesService): ServicePortalApps {
        this._logger.debug(`Processing plugin definition of Kubernetes service: ${service.name}`, packageJson, definition);

        if (!definition) {
            definition = packageJson?.mashroom;
        }
        if (!definition || !Array.isArray(definition.plugins)) {
            throw new Error(`No plugin definition found for Kubernetes service ${service.url}. Neither an external plugin definition file nor a "mashroom" property in package.json has been found.`);
        }

        const portalAppDefinitions = definition.plugins.filter((plugin) => plugin.type === 'portal-app' || plugin.type === 'portal-app2');

        if (portalAppDefinitions.length === 0) {
            throw new Error('No plugin of type portal-app found in remote Portal App');
        }

        const portalApps: Array<MashroomPortalApp> = [];
        const invalidPortalApps: Array<KubernetesServiceInvalidPortalApp> = [];
        portalAppDefinitions.forEach((definition) => {
            try {
                portalApps.push(this._mapPluginDefinition(packageJson, definition, service));
            } catch (e: any) {
                invalidPortalApps.push({
                    name: definition.name,
                    error: e.message,
                });
            }
        });

        const foundPortalApps = portalApps.map((portalApp) => {
            const existingApp = service.foundPortalApps?.find((existingApp) => existingApp.name === portalApp.name);
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

    private _mapPluginDefinition(packageJson: any | null, definition: MashroomPluginDefinition, service: KubernetesService): MashroomPortalApp {
        const version = definition.type === 'portal-app2' ? 2 : 1;
        this._logger.debug(`Detected plugin config version for portal-app ${definition.name}: ${version}`);

        const name = definition.name;
        if (!name) {
            throw new Error('Invalid Portal App definition: No "name" attribute!');
        }
        if (name.match(configUtils.INVALID_PLUGIN_NAME_CHARACTERS)) {
            throw new Error(`Invalid Portal App definition ${name}: The name contains invalid characters (/,?).`);
        }
        const serviceWithSameApp = context.registry.services.find((s) => s.url !== service.url && s.foundPortalApps.find((p) => p.name === name));
        if (serviceWithSameApp && service.priority >= serviceWithSameApp.priority) {
            throw new Error(`Duplicate Portal App '${name}': The name is already used by ${serviceWithSameApp.url} which has higher priority`);
        }

        const clientBootstrap = version === 2 ? definition.clientBootstrap : definition.bootstrap;
        if (!clientBootstrap) {
           if (version === 2) {
               throw new Error(`Invalid configuration of plugin ${name}: No clientBootstrap property defined.`);
           } else {
               throw new Error(`Invalid configuration of plugin ${name}: No bootstrap property defined.`);
           }
        }

        const resourcesDef = definition.resources;
        if (!resourcesDef) {
            throw new Error(`Invalid configuration of plugin ${name}: No resources defined.`);
        }

        const resources = {
            js: resourcesDef.js,
            css: resourcesDef.css,
        };
        if (!resources.js) {
            throw new Error(`Invalid configuration of plugin ${name}: No resources.js defined.`);
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
            resourcesRootUri = `${service.url}${definition.remote?.resourcesRoot || ''}`;
            if (resourcesRootUri.endsWith('/')) {
                resourcesRootUri = resourcesRootUri.slice(0, -1);
            }
        } else {
            resourcesRootUri = service.url;
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
                if (Object.prototype.hasOwnProperty.call(definedRestProxies, proxyName)) {
                    let targetUri = definedRestProxies[proxyName].targetUri;
                    if (!targetUri) {
                        throw new Error(`Invalid configuration of plugin ${name}: No targetUri defined for proxy ${proxyName}.`);
                    }
                    if (targetUri.startsWith('/')) {
                        targetUri = service.url + targetUri;
                    }
                    try {
                        const parsedUri = new URL(targetUri);
                        if (parsedUri.hostname === 'localhost') {
                            targetUri = service.url + (parsedUri.pathname && parsedUri.pathname !== '/' ? parsedUri.pathname : '');
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
                ssrInitialHtmlUri = `${service.url}${definition.remote.ssrInitialHtmlPath}`;
                if (ssrInitialHtmlUri.endsWith('/')) {
                    ssrInitialHtmlUri = ssrInitialHtmlUri.slice(0, -1);
                }
            }
            cachingConfig = config.caching;
            editorConfig = config.editor;
        }

       return {
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
    }

}
