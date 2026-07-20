
import {KubeConfig} from '@kubernetes/client-node';
import WatchWithReconnect from './WatchWithReconnect';

import type {
    KubernetesConnector as KubernetesConnectorType, KubernetesWatchCallback,
    KubernetesWatcher
} from '../types';
import type {V1Namespace, V1Pod, V1Service} from '@kubernetes/client-node';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';

export default class KubernetesConnector implements KubernetesConnectorType {

    private _logger: MashroomLogger;
    private _watch?: WatchWithReconnect;

    constructor(private localConfig: boolean, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.scanner.remotePackageKubernetes');
    }

    async watchNamespaces(labelSelector: string, cb: KubernetesWatchCallback<V1Namespace>): Promise<KubernetesWatcher> {
        if (!this._watch) {
            await this.#init();
        }
        return this._watch!.watch('/api/v1/namespaces', {
            labelSelector,
        }, cb);
    }

    async watchServices(namespace: string, labelSelector: string | undefined, cb: KubernetesWatchCallback<V1Service>): Promise<KubernetesWatcher> {
        if (!this._watch) {
            await this.#init();
        }
        return this._watch!.watch(`/api/v1/namespaces/${namespace}/services`, {
            labelSelector,
        }, cb);
    }

    async watchPods(namespace: string, cb: KubernetesWatchCallback<V1Pod>): Promise<KubernetesWatcher> {
        if (!this._watch) {
            await this.#init();
        }
        return this._watch!.watch(`/api/v1/namespaces/${namespace}/pods`, {
        }, cb);
    }

    async #init() {
        const k8sClient = new KubeConfig();
        if (!this.localConfig) {
            // This only works if the Portal runs within a Kubernetes Pod with a valid service account attached
            k8sClient.loadFromCluster();
        } else {
            // This uses the local kubectl config (only for test purposes!)
            k8sClient.loadFromDefault();
        }
        this._watch = new WatchWithReconnect(k8sClient, this._logger);
    }

}
