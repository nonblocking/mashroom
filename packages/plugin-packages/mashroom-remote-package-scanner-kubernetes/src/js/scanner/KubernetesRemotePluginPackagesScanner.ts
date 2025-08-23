import context from '../context';
import serviceEventCallback from './serviceEventCallback';
import podEventCallback from './podEventCallback';
import removePluginPackageService from './removePluginPackageService';
import type {V1Namespace} from '@kubernetes/client-node';
import type {KUBERNETES_WATCH_EVENTS, KubernetesConnector, KubernetesWatcher} from '../types';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPluginPackageScanner,
    MashroomPluginScannerCallback
} from '@mashroom/mashroom/type-definitions';

export const SCANNER_NAME = 'Kubernetes Remote Portal Apps Plugin Scanner';

export default class KubernetesRemotePluginPackagesScanner implements MashroomPluginPackageScanner {

    private readonly _serviceNameFilter: RegExp;
    private _namespaceWatchers: Array<KubernetesWatcher> = [];
    private readonly _logger: MashroomLogger;

    constructor(private _namespaceLabelSelector: string | Array<string> | null | undefined, private _namespaces: Array<string> | null | undefined,
                private _serviceLabelSelector: string | Array<string> | null | undefined, serviceNameFilterStr: string | null | undefined,
                private _kubernetesConnector: KubernetesConnector, loggerFactory: MashroomLoggerFactory) {
        this._serviceNameFilter = new RegExp(serviceNameFilterStr || '.*', 'i');
        this._logger = loggerFactory('mashroom.scanner.remotePackageKubernetes');
    }

    get name() {
        return SCANNER_NAME;
    }

    setCallback(callback: MashroomPluginScannerCallback) {
        context.scannerCallback = callback;
    }

    async start() {
        if (Array.isArray(this._namespaces)) {
            this._namespaces.forEach((ns) => {
                this._startWatchNamespace(ns);
            });
        }
        if (this._namespaceLabelSelector) {
            const labelSelectors: Array<string> = Array.isArray(this._namespaceLabelSelector) ? this._namespaceLabelSelector : [this._namespaceLabelSelector];
            for (const labelSelector of labelSelectors) {
                try {
                    const abortController = await this._kubernetesConnector.watchNamespaces(labelSelector, this._namespaceEventCallback.bind(this));
                    this._namespaceWatchers.push(abortController);
                } catch (e) {
                    this._logger.error(`Watching Kubernetes Namespace with labelSelector ${labelSelector} failed!`, e);
                }
            }
        }

        // Wait a few seconds until the initial services are added
        setTimeout(() => {
            context.initialScanDone = true;
        }, 3000);
    }

    async stop() {
        // Abort all watches
        for (const namespaceWatcher of this._namespaceWatchers) {
            namespaceWatcher.abort();
        }
        for (const watchedNamespace of context.watchedNamespaces) {
            for (const watcher of watchedNamespace.servicesWatchers) {
                watcher.abort();
            }
            for (const watcher of watchedNamespace.podsWatchers) {
                watcher.abort();
            }
        }
    }

    private async _startWatchNamespace(namespace: string) {
        const existing = context.watchedNamespaces.find((wn) => wn.name === namespace);
        if (existing) {
            this._logger.debug(`Kubernetes Namespace ${namespace} already watched`);
            return;
        }

        this._logger.info(`Start watching Kubernetes Services and Pods in Namespace: ${namespace}`);

        const servicesWatchers: Array<KubernetesWatcher> = [];
        const podsWatchers: Array<KubernetesWatcher> = [];
        context.watchedNamespaces.push({
            name: namespace,
            servicesWatchers,
            podsWatchers,
        });

        let serviceLabelSelectors: Array<string | undefined> = [undefined];
        if (this._serviceLabelSelector) {
            serviceLabelSelectors = Array.isArray(this._serviceLabelSelector) ? this._serviceLabelSelector : [this._serviceLabelSelector];
        }
        for (const serviceLabelSelector of serviceLabelSelectors) {
            try {
                servicesWatchers.push(await this._kubernetesConnector.watchServices(namespace, serviceLabelSelector,
                    serviceEventCallback(this._serviceNameFilter, this._logger)));
            } catch (e) {
                this._logger.error(`Watching Kubernetes Services in Namespace ${namespace} with labelSelector ${serviceLabelSelector} failed!`, e);
            }
        }

        try {
            podsWatchers.push(await this._kubernetesConnector.watchPods(namespace,
                podEventCallback(this._logger)));
        } catch (e) {
            this._logger.error(`Watching Kubernetes Pods in Namespace ${namespace} failed!`, e);
        }
    }

    private _stopWatchNamespace(namespace: string) {
        const existing = context.watchedNamespaces.find((wn) => wn.name === namespace);
        if (!existing) {
            return;
        }

        this._logger.info(`Stop watching and removing all remote plugin packages in Kubernetes Namespace: ${namespace}`);
        for (const watcher of existing.servicesWatchers) {
            watcher.abort();
        }
        for (const watcher of existing.podsWatchers) {
            watcher.abort();
        }

        context.watchedNamespaces = context.watchedNamespaces.filter((wn) => wn !== existing);
        context.runningPods = context.runningPods.filter((pod) => pod.namespace !== namespace);
        const servicesInNamespace = context.services.filter((service) => service.namespace === namespace);

        for (const sin of servicesInNamespace) {
            removePluginPackageService(sin, this._logger);
        }
    }

    private _namespaceEventCallback(event: KUBERNETES_WATCH_EVENTS, namespace: V1Namespace) {
        if (!namespace.metadata?.name) {
            return;
        }
        if (event === 'ADDED') {
            this._startWatchNamespace(namespace.metadata.name);
        } else if (event === 'DELETED') {
            this._stopWatchNamespace(namespace.metadata.name);
        }
     }
}
