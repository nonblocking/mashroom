
import {MashroomPortalApp, MashroomRemotePortalAppRegistry} from '@mashroom/mashroom-portal/type-definitions';
import {CoreV1Api, V1ServiceList} from "@kubernetes/client-node";

export interface ScanBackgroundJob {
    start(): void;
    stop(): void;
}

export interface KubernetesConnector {
    init(): void;
    listNamespaceServices(namespace: string): Promise<V1ServiceList>;
}

export type KubernetesServiceStatus = 'Checking' | 'Valid' | 'Headless Service' | 'No Descriptor' | 'Error';

export type KubernetesService = {
    readonly name: string;
    readonly namespace: string;
    readonly ip: string | undefined;
    readonly port: number | undefined;
    readonly url: string;
    readonly firstSeen: number;
    lastCheck: number;
    status: KubernetesServiceStatus;
    error: string | null;
    foundPortalApps: Array<MashroomPortalApp>;
}

export interface KubernetesServiceRegistry extends MashroomRemotePortalAppRegistry {
    getService(name: string): KubernetesService | undefined;
    addOrUpdateService(service: KubernetesService): void;
    removeService(name: string): void;
    readonly services: readonly KubernetesService[];
}

export type Context = {
    readonly registry: KubernetesServiceRegistry;
    serviceNameFilter: string;
    lastScan: number;
    error: string | null;
}

export type ServicesRenderModel = {
    baseUrl: string;
    scanError: string | null;
    lastScan: string;
    serviceNameFilter: string;
    services: Array<{
        name: string;
        namespace: string;
        url: string;
        status: string;
        portalApps: string;
        lastCheck: string;
        rowClass: string;
        statusClass: string;
    }>
}
