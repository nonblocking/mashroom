
import type {MashroomPluginPackageDefinition} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalApp, MashroomRemotePortalAppRegistry} from '@mashroom/mashroom-portal/type-definitions';
import type {V1NamespaceList, V1ServiceList} from '@kubernetes/client-node';

export type RemoteAppPackageJson = {
    readonly name: string;
    readonly version: string;
    readonly description?: string;
    readonly author?: string;
    readonly homepage?: string;
    readonly license?: string;
    readonly mashroom?: MashroomPluginPackageDefinition;
}

export interface ScanBackgroundJob {
    run(): Promise<void>;
}

export interface KubernetesConnector {
    getNamespacesByLabel(labelSelector: string): Promise<V1NamespaceList>;
    getNamespaceServices(namespace: string, labelSelector?: string | null | undefined): Promise<V1ServiceList>;
}

export type KubernetesServiceStatus = 'Checking' | 'Valid' | 'Headless Service' | 'No Descriptor' | 'Error';

export type KubernetesServiceInvalidPortalApp = {
    readonly name: string;
    readonly error: string;
}

export type KubernetesService = {
    readonly name: string;
    readonly namespace: string;
    readonly priority: number;
    readonly ip: string | undefined;
    readonly port: number | undefined;
    readonly url: string;
    readonly firstSeen: number;
    lastCheck: number;
    status: KubernetesServiceStatus;
    error: string | null;
    retries: number;
    foundPortalApps: Array<MashroomPortalApp>;
    invalidPortalApps: Array<KubernetesServiceInvalidPortalApp>;
}

export interface KubernetesServiceRegistry extends MashroomRemotePortalAppRegistry {
    getService(namespace: string, name: string): KubernetesService | undefined;
    addOrUpdateService(service: KubernetesService): void;
    removeService(namespace: string, name: string): void;
    readonly services: readonly KubernetesService[];
}

export type Context = {
    readonly registry: KubernetesServiceRegistry;
    namespaces: Array<string>;
    serviceLabelSelector: string | null;
    serviceNameFilter: string;
    lastScan: number;
    errors: Array<string>;
    oneFullScanDone: boolean;
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
        portalApps: Array<{
            name: string;
            version: string;
            pluginDef: string;
        }>;
    }>
}
