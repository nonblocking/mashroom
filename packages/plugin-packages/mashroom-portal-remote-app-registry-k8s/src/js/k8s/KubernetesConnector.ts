
import {CoreV1Api, KubeConfig, V1ServiceList} from '@kubernetes/client-node';

import type {KubernetesConnector as KubernetesConnectorType} from '../../../type-definitions';

export default class KubernetesConnector implements KubernetesConnectorType {

    private _k8sApi?: CoreV1Api;

    init(): void {
        if (!this._k8sApi) {
            this._setupK8sApi();
        }
    }

    async listNamespaceServices(namespace: string): Promise<V1ServiceList> {
        if (!this._k8sApi) {
            return Promise.reject((new Error('No k8s client found. Did you forget to call init()?')));
        }
        const result = await this._k8sApi.listNamespacedService(namespace);
        return result.body;
    }

    private _setupK8sApi(): void {
        const k8sClient = new KubeConfig();
        // This only works if the Portal runs within a Kubernetes Pod with a valid service account attached
        k8sClient.loadFromCluster();
        this._k8sApi = k8sClient.makeApiClient(CoreV1Api);
    }

}
