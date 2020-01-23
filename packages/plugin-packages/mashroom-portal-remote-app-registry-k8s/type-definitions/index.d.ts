
import {MashroomPortalApp, MashroomRemotePortalAppRegistry} from "../../mashroom-portal/type-definitions";

export interface ScanBackgroundJob {
    start(): void;
    stop(): void;
}

export type KubernetesService = {
    readonly name: string;
    readonly namespace: string;
    readonly ip: string;
    readonly port: number;
    readonly url: string;
    readonly firstSeen: number;
    lastCheck: number;
    descriptorFound: boolean;
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
    lastScan: number;
    error: string | null;
}

export type ServicesRenderModel = {
    baseUrl: string;
    error: string | null;
    lastScan: string;
    totalServices: string;
    services: Array<{
        name: string;
        namespace: string;
        url: string;
        status: 'Registered' |  'Error';
        portalApps: string;
        lastCheck: string;
        rowClass: string;
        statusClass: string;
    }>
}
