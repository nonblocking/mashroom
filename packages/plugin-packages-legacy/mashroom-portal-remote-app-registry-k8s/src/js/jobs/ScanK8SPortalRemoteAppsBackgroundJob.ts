
import context from '../context';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
} from '@mashroom/mashroom/type-definitions';
import type {KubernetesConnector, KubernetesService} from '../../../type-definitions';

const createServiceURL = (name: string, namespace: string, port: number | undefined, ip: string | undefined, accessViaClusterIP: boolean) => {
    if (!port || accessViaClusterIP && !ip) {
        return new URL(`http://${name}.${namespace}`);
    }
    return accessViaClusterIP ? new URL(`http://${ip}:${port}`) : new URL(`http://${name}.${namespace}:${port}`);
};

export default class ScanK8SPortalRemoteAppsBackgroundJob {

    private readonly _serviceNameFilter: RegExp;
    private readonly _logger: MashroomLogger;

    constructor(private _k8sNamespacesLabelSelector: string | Array<string> | null | undefined, private _k8sNamespaces: Array<string> | null | undefined,
                private _k8sServiceLabelSelector: string | Array<string> | null | undefined, serviceNameFilterStr: string | null | undefined,
                private _refreshIntervalSec: number, private _accessViaClusterIP: boolean,
                private _kubernetesConnector: KubernetesConnector, loggerFactory: MashroomLoggerFactory) {
        this._serviceNameFilter = new RegExp(serviceNameFilterStr || '.*', 'i');
        this._logger = loggerFactory('mashroom.portal.remoteAppRegistryK8s');
    }

    async run() {
        await this._scanKubernetesServices();
    }

    async _scanKubernetesServices(): Promise<void> {
        const startTime = Date.now();
        this._logger.info('Start processing remote Kubernetes Remote Portal Apps');

        context.lastScan = startTime;
        context.errors = [];

        // Step 1: Determine K8S namespaces
        const namespaces = await this._determineNamespaces();
        context.namespaces = namespaces;
        const namespaceScanFailures = context.errors.length > 0;
        const namespaceServiceScanFailures: Array<string> = [];

        // Step 2: Determine K8S services
        this._logger.info('Start scanning Kubernetes namespaces: ', namespaces);
        const foundServices: Array<{ name: string, namespace: string }> = [];

        await Promise.all(namespaces.map(async (namespace) => {
            let labelSelectors: Array<string | undefined> = [undefined];
            if (this._k8sServiceLabelSelector) {
                labelSelectors = Array.isArray(this._k8sServiceLabelSelector) ? this._k8sServiceLabelSelector : [this._k8sServiceLabelSelector];
            }

            await Promise.all(labelSelectors.map(async (labelSelector) => {
                try {
                    const res = await this._kubernetesConnector.getNamespaceServices(namespace, labelSelector);
                    const serviceItems = res.items;

                    for (let j = 0; j < serviceItems.length; j++) {
                        const serviceItem = serviceItems[j];

                        const name = serviceItem?.metadata?.name;
                        if (name && name.match(this._serviceNameFilter)) {
                            foundServices.push({ name, namespace });
                            const existingService = context.services.find((s) => s.name === name && s.namespace === namespace);
                            const ip = serviceItem?.spec?.clusterIP;
                            const ports = serviceItem?.spec?.ports;
                            const port = ports && ports.length > 0 ? ports[0].port : undefined;
                            const headlessService = !port || !ip || ip.toLowerCase() === 'none';
                            const url = createServiceURL(name, namespace, port, ip, this._accessViaClusterIP);
                            let service: KubernetesService | undefined;

                            if (existingService) {
                                if (existingService.lastCheck < Date.now() - this._refreshIntervalSec * 1000 || existingService.port !== port) {
                                    service = {
                                        ...existingService,
                                        lastCheck: Date.now(),
                                        error: null,
                                        port,
                                        url,
                                    };
                                    context.services[context.services.indexOf(existingService)] = service;
                                }
                            } else {
                                this._logger.info(`Adding new Kubernetes service: ${name} (${url})`);
                                service = {
                                    name,
                                    namespace,
                                    ip,
                                    port,
                                    url,
                                    error: null,
                                    firstSeen: Date.now(),
                                    lastCheck: Date.now(),
                                };
                                context.services.push(service);
                            }

                            if (service) {
                                if (headlessService) {
                                    service.error = 'Headless Service';
                                } else {
                                    service.error = null;
                                    if (existingService && existingService.url.toString() !== service.url.toString()) {
                                        context.scannerCallback?.removePackageUrl(existingService.url);
                                    }
                                    context.scannerCallback?.addOrUpdatePackageUrl(service.url);
                                }
                            }
                        }
                    }
                } catch (error: any) {
                    namespaceServiceScanFailures.push(namespace);
                    context.errors.push(`Error scanning services in namespace ${namespace} with label selector ${labelSelector}: ${error.message}`);
                    this._logger.error(`Error scanning services in namespace ${namespace} with label selector ${labelSelector}`, error);
                }
            }));
        }));

        // Step 3: Remove services that no longer exist, but only if the K8S API calls didn't fail
        const missingServices = context.services.filter(({name, namespace}) => !foundServices.find((s) => s.namespace === namespace && s.name === name));
        missingServices.forEach((service) => {
            const serviceNamespaceRemoved = !namespaceScanFailures && namespaces.indexOf(service.namespace) === -1;
            const serviceRemoved = namespaceServiceScanFailures.indexOf(service.namespace) === -1;
            if (serviceNamespaceRemoved || serviceRemoved) {
                context.services.splice(context.services.indexOf(service), 1);
                context.scannerCallback?.removePackageUrl(service.url);
            }
        });

        context.initialScanDone = true;

        this._logger.info(`Processed ${foundServices.length} services in ${namespaces.length} namespaces in ${Date.now() - startTime}ms`);
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

}
