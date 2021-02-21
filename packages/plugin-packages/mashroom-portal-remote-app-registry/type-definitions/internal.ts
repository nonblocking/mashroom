
import type {Request, RequestHandler} from 'express';
import type {MashroomPortalApp, MashroomRemotePortalAppRegistry} from '@mashroom/mashroom-portal/type-definitions';
import type {
    RemotePortalAppEndpoint,
} from './api';

export type RemotePortalAppEndpointAddRequest = {
    readonly url: string,
    readonly sessionOnly?: boolean
}

export interface RegisterPortalRemoteAppsBackgroundJob {
    run(): void;
    fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<RemotePortalAppEndpoint>;
    refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void>;
}

export interface RemotePortalAppRegistry extends MashroomRemotePortalAppRegistry {
    registerRemotePortalApp(portalApp: MashroomPortalApp): void;
    registerRemotePortalAppForSession(portalApp: MashroomPortalApp, request: Request): void;
    unregisterRemotePortalApp(name: string): void;
}

export type Context = {
    readonly registry: RemotePortalAppRegistry;
    webUIShowAddRemoteAppForm: boolean;
    backgroundJob: RegisterPortalRemoteAppsBackgroundJob;
}

export type GlobalRequestHolder = {
    request: Request | undefined | null;
}

export interface RegisterRequestGloballyMiddleware {
    middleware(): RequestHandler
}
