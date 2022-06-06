
import {URL} from 'url';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import {evaluateTemplatesInConfigObject, INVALID_PLUGIN_NAME_CHARACTERS} from '@mashroom/mashroom-utils/lib/config_utils';
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

    private _serviceNameFilter: RegExp;
    private _logger: MashroomLogger;

    constructor(private _k8sNamespacesLabelSelector: string | null | undefined, private _k8sNamespaces: Array<string> | null | undefined,
                private _k8sServiceLabelSelector: string | null | undefined, serviceNameFilterStr: string | null | undefined,
                private _socketTimeoutSec: number, private _refreshIntervalSec: number, private _accessViaClusterIP: boolean,
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
        this._logger.info('Starting scan of k8s namespaces: ', namespaces);

        for (let i = 0; i < namespaces.length; i++) {
            const namespace = namespaces[i];

            try {
                const res = await this._kubernetesConnector.getNamespaceServices(namespace, this._k8sServiceLabelSelector);
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
                                };
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
            } catch (error: any) {
                context.errors.push(`Error scanning services in namespace ${namespace}: ${error.message}`);
                this._logger.error(`Error scanning services in namespace ${namespace}`, error);
            }
        }

        this._removeAppsNotSeenForALongTime();
    }

    private async _determineNamespaces(): Promise<Array<string>> {
        const namespaces = [...this._k8sNamespaces || []];
        if (this._k8sNamespacesLabelSelector) {
            try {
                const additionalNamespaces = await this._kubernetesConnector.getNamespacesByLabel(this._k8sNamespacesLabelSelector);
                additionalNamespaces.items.forEach((ns) => {
                    if (ns.metadata?.name) {
                        namespaces.push(ns.metadata.name);
                    }
                });
            } catch (e: any) {
                context.errors.push(`Error scanning namespaces in cluster: ${e.message}`);
                this._logger.error(`Error scanning namespaces with labelSelector: ${this._k8sNamespacesLabelSelector}`, e);
            }
        }
        this._logger.debug('Determined namespaces to scan:', namespaces.join(', '));
        return namespaces;
    }

    private async _checkServiceForRemotePortalApps(service: KubernetesService): Promise<void> {
        this._logger.debug('Checking service:', service);

        let portalApps = [];
        try {
            const externalPluginDefinition = await this._loadExternalPluginDefinition(service.url);
            const packageJson = await this._loadPackageJson(service.url);

            portalApps = this.processPluginDefinition(packageJson, externalPluginDefinition, service);
            this._logger.info(`Registered Portal Apps for Kubernetes service: ${service.name}:`, portalApps);
        } catch (error: any) {
            service.status = 'Error';
            service.error = error.message;
            service.foundPortalApps = [];
            this._logger.error(`Processing remote Portal App info for Kubernetes service ${service.name} failed!`, error);
            return;
        }

        service.status = 'Valid';
        service.foundPortalApps = portalApps;
    }

    private async _loadPackageJson(serviceUrl: string): Promise<any | null> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
            },  this._socketTimeoutSec * 1000);
            const result = await fetch(`${serviceUrl}/package.json`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (result.ok) {
                return result.json();
            } else {
                this._logger.warn(`Fetching package.json from ${serviceUrl} failed with status code ${result.status}`);
            }
        } catch (e) {
            this._logger.warn(`Fetching package.json from ${serviceUrl} failed`, e);
        }
        return null;
    }

    private async _loadExternalPluginDefinition(serviceUrl: string): Promise<MashroomPluginPackageDefinition | null> {
        const promises = this._externalPluginConfigFileNames.map(async (name) => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => {
                    controller.abort();
                },  this._socketTimeoutSec * 1000);
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

    processPluginDefinition(packageJson: any | null, definition: MashroomPluginPackageDefinition | null, service: KubernetesService): Array<MashroomPortalApp> {
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

        const portalApps = portalAppDefinitions.map((definition) => this._mapPluginDefinition(packageJson, definition, service.url));

        return portalApps.map((portalApp) => {
            const existingApp = service.foundPortalApps?.find((existingApp) => existingApp.name === portalApp.name);
            if (existingApp && existingApp.version === portalApp.version) {
                // Keep reload timestamp for browser caching
                return {...portalApp, lastReloadTs: existingApp.lastReloadTs};
            }

            return portalApp;
        });
    }

    private _mapPluginDefinition(packageJson: any | null, definition: MashroomPluginDefinition, serviceUrl: string): MashroomPortalApp {
        const version = definition.type === 'portal-app2' ? 2 : 1;
        this._logger.debug(`Detected plugin config version for portal-app ${definition.name}: ${version}`);

        const name = definition.name;
        if (!name) {
            throw new Error('Invalid Portal App definition: No "name" attribute!');
        }
        if (name.match(INVALID_PLUGIN_NAME_CHARACTERS)) {
            throw new Error(`Invalid Portal App definition ${name}: The name contains invalid characters (/,?).`);
        }
        const existingPortalApp = context.registry.portalApps.find((a) => a.name === name && a.resourcesRootUri.indexOf(serviceUrl) !== 0);
        if (existingPortalApp) {
            throw new Error(`Invalid Portal App '${name}': The name is already defined on service ${existingPortalApp.resourcesRootUri}`);
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
            resourcesRootUri = `${serviceUrl}${definition.remote?.resourcesRoot || ''}`;
            if (resourcesRootUri.endsWith('/')) {
                resourcesRootUri = resourcesRootUri.slice(0, -1);
            }
        } else {
            resourcesRootUri = serviceUrl;
        }

        const config = definition.defaultConfig || {};
        evaluateTemplatesInConfigObject(config, this._logger);

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
                        targetUri = serviceUrl + targetUri;
                    }
                    try {
                        const parsedUri = new URL(targetUri);
                        if (parsedUri.hostname === 'localhost') {
                            targetUri = serviceUrl + (parsedUri.pathname && parsedUri.pathname !== '/' ? parsedUri.pathname : '');
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
                ssrInitialHtmlUri = `${serviceUrl}${definition.remote.ssrInitialHtmlPath}`;
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
