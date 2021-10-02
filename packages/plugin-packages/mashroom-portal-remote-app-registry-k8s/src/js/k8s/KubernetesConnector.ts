
import {CoreV1Api, KubeConfig, V1NamespaceList, V1ServiceList} from '@kubernetes/client-node';

import type {KubernetesConnector as KubernetesConnectorType} from '../../../type-definitions';

export default class KubernetesConnector implements KubernetesConnectorType {

    private _k8sApi?: CoreV1Api;

    constructor(private test?: boolean) {
    }

    async getNamespacesByLabel(labelSelector: string): Promise<V1NamespaceList> {
        if (!this._k8sApi) {
            this.init();
        }
        if (!this._k8sApi) {
            throw new Error('No k8s client found.');
        }
        const result = await this._k8sApi.listNamespace(undefined, undefined, undefined, undefined, labelSelector);
        return result.body;
    }

    async getNamespaceServices(namespace: string): Promise<V1ServiceList> {
        if (!this._k8sApi) {
            this.init();
        }
        if (!this._k8sApi) {
            throw new Error('No k8s client found.');
        }
        const result = await this._k8sApi.listNamespacedService(namespace);
        return result.body;
    }

    private init(): void {
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
