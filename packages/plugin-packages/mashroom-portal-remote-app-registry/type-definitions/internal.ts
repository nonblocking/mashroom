
import type {Request, RequestHandler} from 'express';
import type {MashroomPortalApp, MashroomRemotePortalAppRegistry} from '@mashroom/mashroom-portal/type-definitions';
import type {
    RemotePortalAppEndpoint,
} from './api';

// Session data
declare module 'express-session' {
    interface SessionData {
        __MASHROOM_PORTAL_REMOTE_APPS?: Array<MashroomPortalApp>;
        __MASHROOM_PORTAL_REMOTE_APP_ENDPOINTS?: Array<RemotePortalAppEndpoint>;
    }
}

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
    unregisterRemotePortalAppForSession(name: string, request: Request): void;
}

export type Context = {
    readonly registry: RemotePortalAppRegistry;
    webUIShowAddRemoteAppForm: boolean;
    backgroundJob: RegisterPortalRemoteAppsBackgroundJob;
    oneFullScanDone: boolean;
}

export type GlobalRequestHolder = {
    request: Request | undefined | null;
}

export interface RegisterRequestGloballyMiddleware {
    middleware(): RequestHandler
}
