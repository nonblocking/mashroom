// @flow

import type {MashroomPortalApp, MashroomRemotePortalAppRegistry} from '@mashroom/mashroom-portal/type-definitions';
import type {ExpressMiddleware, ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {
    RemotePortalAppEndpoint,
} from './api';

export type RemotePortalAppEndpointAddRequest = {
    +url: string,
    +sessionOnly?: boolean
}

export interface RegisterPortalRemoteAppsBackgroundJob {
    start(): void;
    runASAP(): void;
    fetchPortalAppDataAndUpdateEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<RemotePortalAppEndpoint>;
    refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void>;
}

export interface RemotePortalAppRegistry extends MashroomRemotePortalAppRegistry {
    registerRemotePortalApp(portalApp: MashroomPortalApp): void;
    registerRemotePortalAppForSession(portalApp: MashroomPortalApp, request: ExpressRequest): void;
    unregisterRemotePortalApp(name: string): void;
}

export type GlobalRequestHolder = {
    request: ?ExpressRequest
}

export interface RegisterRequestGloballyMiddleware {
    middleware(): ExpressMiddleware
}
