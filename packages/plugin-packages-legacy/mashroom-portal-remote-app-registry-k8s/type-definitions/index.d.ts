
import type {URL} from 'url';
import type {V1NamespaceList, V1ServiceList} from '@kubernetes/client-node';
import type {MashroomPluginScannerCallback} from '@mashroom/mashroom/type-definitions';

export interface KubernetesConnector {
    getNamespacesByLabel(labelSelector: string): Promise<V1NamespaceList>;
    getNamespaceServices(namespace: string, labelSelector?: string | undefined): Promise<V1ServiceList>;
}

export type KubernetesService = {
    readonly name: string;
    readonly namespace: string;
    readonly ip: string | undefined;
    readonly port: number | undefined;
    readonly url: URL;
    readonly firstSeen: number;
    lastCheck: number;
    error: string | null;
}

export type Context = {
    namespaces: Array<string>;
    serviceLabelSelector: string | null;
    serviceNameFilter: string;
    errors: Array<string>;
    services: Array<KubernetesService>;
    scannerCallback: MashroomPluginScannerCallback | null;
    lastScan: number;
    initialScanDone: boolean;
}

export type ServicesRenderModel = {
    baseUrl: string;
    hasErrors: boolean;
    errors: Array<string>;
    lastScan: string;
    namespaces: string;
    serviceLabelSelector: string | null;
    serviceNameFilter: string;
    services: Array<{
        name: string;
        namespace: string;
        url: string;
        status: string;
        lastCheck: string;
        rowClass: string;
        statusClass: string;
        portalApps: Array<string> | undefined;
        errors: string | undefined;
    }>
}
