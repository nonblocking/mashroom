
import type {URL} from 'url';
import type {V1Namespace, V1Service, V1Pod} from '@kubernetes/client-node';
import type {MashroomPluginScannerCallback} from '@mashroom/mashroom/type-definitions';

export type KUBERNETES_WATCH_EVENTS = 'ADDED' | 'MODIFIED' | 'DELETED';
export type KubernetesWatchCallback<RES> = (event: KUBERNETES_WATCH_EVENTS, apiObj: RES) => void;

export interface KubernetesConnector {
    watchNamespaces(labelSelector: string, cb: KubernetesWatchCallback<V1Namespace>): Promise<AbortController>;
    watchServices(namespace: string, labelSelector: string | undefined, cb: KubernetesWatchCallback<V1Service>): Promise<AbortController>;
    watchPods(namespace: string, cb: KubernetesWatchCallback<V1Pod>): Promise<AbortController>;
}

export type KubernetesWatcher = {
    abort(): void;
}

export type KubernetesWatchedNamespace = {
    readonly name: string;
    readonly servicesWatchers: Array<KubernetesWatcher>;
    readonly podsWatchers: Array<KubernetesWatcher>;
}

export type KubernetesService = {
    readonly uid: string;
    readonly name: string;
    readonly namespace: string | undefined;
    readonly annotations: Record<string, string>;
    readonly firstSeen: number;
    targetPort: string | undefined;
    url: URL | undefined;
    selector: Record<string, string> | undefined;
    runningPods: number;
    imageVersion: string | undefined;
    lastModified: number;
    error: string | null;
}

export type KubernetesContainer = {
    readonly imageVersion: string;
    readonly containerPort: string;
}

export type KubernetesRunningPod = {
    readonly uid: string;
    readonly name: string;
    readonly namespace: string | undefined;
    readonly containers: Array<KubernetesContainer>;
    labels: Record<string, string>;
    lastModified: number;
}

export type Context = {
    namespaceLabelSelector: string | null;
    serviceLabelSelector: string | null;
    serviceNameFilter: string;
    errors: Array<string>;
    watchedNamespaces: Array<KubernetesWatchedNamespace>;
    services: Array<KubernetesService>;
    runningPods: Array<KubernetesRunningPod>;
    scannerCallback: MashroomPluginScannerCallback | null;
    initialScanDone: boolean;
}

export type ServicesRenderModel = {
    readonly baseUrl: string;
    readonly hasErrors: boolean;
    readonly errors: Array<string>;
    readonly namespaceLabelSelector: string | null;
    readonly watchedNamespaces: string;
    readonly serviceLabelSelector: string | null;
    readonly serviceNameFilter: string;
    readonly services: Array<{
        readonly name: string;
        readonly namespace: string;
        readonly url: string;
        readonly status: string;
        readonly lastModified: string;
        readonly rowClass: string;
        readonly statusClass: string;
        readonly runningPods: number;
        readonly imageVersion: string | undefined;
        readonly portalApps: Array<string> | undefined;
        readonly errors: string | undefined;
    }>
}
