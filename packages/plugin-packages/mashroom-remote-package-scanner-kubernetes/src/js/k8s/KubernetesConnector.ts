
import type {KUBERNETES_WATCH_EVENTS, KubernetesConnector as KubernetesConnectorType, KubernetesWatchCallback} from '../types';
import type {CoreV1Api, V1Namespace, V1Pod, V1Service, Watch} from '@kubernetes/client-node';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';

export default class KubernetesConnector implements KubernetesConnectorType {

    private _logger: MashroomLogger;
    private _k8sApi?: CoreV1Api;
    private _watch?: Watch;

    constructor(private localConfig: boolean, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.scanner.remotePackageKubernetes');
    }

    async watchNamespaces(labelSelector: string, cb: KubernetesWatchCallback<V1Namespace>): Promise<AbortController> {
        if (!this._watch) {
            await this.#init();
        }
        return this._watch!.watch('/api/v1/namespaces', {
            labelSelector,
        }, (phase, apiObj) => {
            cb(phase as KUBERNETES_WATCH_EVENTS, apiObj);
        }, (error) => {
            if (error.type !== 'aborted') {
            this._logger.error('K8S watch error:', error);
            }
        });
    }

    async watchServices(namespace: string, labelSelector: string | undefined, cb: KubernetesWatchCallback<V1Service>): Promise<AbortController> {
        if (!this._watch) {
            await this.#init();
        }
        return this._watch!.watch(`/api/v1/namespaces/${namespace}/services`, {
            labelSelector,
        }, (phase, apiObj) => {
            cb(phase as KUBERNETES_WATCH_EVENTS, apiObj);
        }, (error) => {
            if (error.type !== 'aborted') {
                this._logger.error('K8S watch error:', error);
            }
        });
    }

    async watchPods(namespace: string, cb: KubernetesWatchCallback<V1Pod>): Promise<AbortController> {
        if (!this._watch) {
            await this.#init();
        }
        return this._watch!.watch(`/api/v1/namespaces/${namespace}/pods`, {
        }, (phase, apiObj) => {
            cb(phase as KUBERNETES_WATCH_EVENTS, apiObj);
        }, (error) => {
            if (error.type !== 'aborted') {
                this._logger.error('K8S watch error:', error);
            }
        });
    }

    async #init() {
        // '@kubernetes/client-node' is an ESM only module
        const {KubeConfig, CoreV1Api, Watch} = await import('@kubernetes/client-node');
        const k8sClient = new KubeConfig();
        if (!this.localConfig) {
            // This only works if the Portal runs within a Kubernetes Pod with a valid service account attached
            k8sClient.loadFromCluster();
        } else {
            // This uses the local kubectl config (only for test purposes!)
            k8sClient.loadFromDefault();
        }
        this._k8sApi = k8sClient.makeApiClient(CoreV1Api);
        this._watch = new Watch(k8sClient);
    }

}
