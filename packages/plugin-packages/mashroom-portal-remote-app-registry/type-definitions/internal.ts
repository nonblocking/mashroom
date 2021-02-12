
import type {MashroomPortalApp, MashroomRemotePortalAppRegistry} from '@mashroom/mashroom-portal/type-definitions';
import type {ExpressMiddleware, ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {
    RemotePortalAppEndpoint,
} from './api';

export type RemotePortalAppEndpointAddRequest = {
    readonly url: string,
    readonly sessionOnly?: boolean
}

export interface RegisterPortalRemoteAppsBackgroundJob {
    start(): void;
    stop(): void;
    runASAP(): void;
    fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<RemotePortalAppEndpoint>;
    refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void>;
}

export interface RemotePortalAppRegistry extends MashroomRemotePortalAppRegistry {
    registerRemotePortalApp(portalApp: MashroomPortalApp): void;
    registerRemotePortalAppForSession(portalApp: MashroomPortalApp, request: ExpressRequest): void;
    unregisterRemotePortalApp(name: string): void;
}

export type Context = {
    readonly registry: RemotePortalAppRegistry;
    webUIShowAddRemoteAppForm: boolean;
    backgroundJob: RegisterPortalRemoteAppsBackgroundJob;
}

export type GlobalRequestHolder = {
    request: ExpressRequest | undefined | null;
}

export interface RegisterRequestGloballyMiddleware {
    middleware(): ExpressMiddleware
}
