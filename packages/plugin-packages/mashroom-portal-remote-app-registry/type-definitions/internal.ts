
import type {MashroomPluginPackageDefinition} from '@mashroom/mashroom/type-definitions';
import type {Request, RequestHandler} from 'express';
import type {MashroomPortalApp, MashroomPortalAppRegistry} from '@mashroom/mashroom-portal/type-definitions';
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

export type RemoteAppPackageJson = {
    readonly name: string;
    readonly version: string;
    readonly description?: string;
    readonly author?: string;
    readonly homepage?: string;
    readonly license?: string;
    readonly mashroom?: MashroomPluginPackageDefinition;
}

export type RemotePortalAppEndpointAddRequest = {
    readonly url: string,
    readonly sessionOnly?: boolean
}

export interface RegisterPortalRemoteAppsBackgroundJob {
    run(): Promise<void>;
    fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<RemotePortalAppEndpoint>;
    refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void>;
}

export interface RemotePortalAppRegistry extends MashroomPortalAppRegistry {
    registerRemotePortalApp(portalApp: MashroomPortalApp): void;
    registerRemotePortalAppForSession(portalApp: MashroomPortalApp, request: Request): void;
    unregisterRemotePortalApp(name: string): void;
    unregisterRemotePortalAppForSession(name: string, request: Request): void;
}

export type Context = {
    readonly registry: RemotePortalAppRegistry;
    webUIShowAddRemoteAppForm: boolean;
    backgroundJob: RegisterPortalRemoteAppsBackgroundJob | null;
    oneFullScanDone: boolean;
}

export type GlobalRequestHolder = {
    request: Request | undefined | null;
}

export interface RegisterRequestGloballyMiddleware {
    middleware(): RequestHandler
}
