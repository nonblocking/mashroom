
import type {V1NamespaceList, V1ServiceList, CoreV1Api} from '@kubernetes/client-node';

import type {KubernetesConnector as KubernetesConnectorType} from '../../../type-definitions';

export default class KubernetesConnector implements KubernetesConnectorType {

    private _k8sApi?: CoreV1Api;

    constructor(private test?: boolean) {
    }

    async getNamespacesByLabel(labelSelector: string): Promise<V1NamespaceList> {
        if (!this._k8sApi) {
            await this.#init();
        }
        if (!this._k8sApi) {
            throw new Error('No k8s client found.');
        }
        return this._k8sApi.listNamespace({
            labelSelector,
        });
    }

    async getNamespaceServices(namespace: string, labelSelector?: string | undefined): Promise<V1ServiceList> {
        if (!this._k8sApi) {
            await this.#init();
        }
        if (!this._k8sApi) {
            throw new Error('No k8s client found.');
        }
        return this._k8sApi.listNamespacedService({
            namespace,
            labelSelector,
        });
    }

    async #init() {
        // '@kubernetes/client-node' is an ESM only module
        const {KubeConfig, CoreV1Api} = await import('@kubernetes/client-node');
        const k8sClient = new KubeConfig();
        if (!this.test) {
            // This only works if the Portal runs within a Kubernetes Pod with a valid service account attached
            k8sClient.loadFromCluster();
        } else {
            // This uses the local kubectl config (only for test purposes!)
            k8sClient.loadFromDefault();
        }
        this._k8sApi = k8sClient.makeApiClient(CoreV1Api);
    }

}
