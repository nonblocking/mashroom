// @flow

import type {MashroomPortalApp, MashroomRemotePortalAppRegistry} from '@mashroom/mashroom-portal/type-definitions';
import type {ExpressMiddleware, ExpressRequest} from '@mashroom/mashroom/type-definitions';

export type RemotePortalAppEndpoint = {
    +url: string,
    +sessionOnly: boolean,
    +lastError: ?string,
    +retries: number,
    +registrationTimestamp: ?number,
    +portalApps: Array<MashroomPortalApp>
}

export type RemotePortalAppEndpointAddRequest = {
    +url: string,
    +sessionOnly?: boolean
}

export interface MashroomPortalRemoteAppEndpointService {
    registerRemoteAppUrl(url: string): Promise<void>;
    synchronousRegisterRemoteAppUrlInSession(url: string, request: ExpressRequest): Promise<void>;
    unregisterRemoteAppUrl(url: string): Promise<void>;
    findRemotePortalAppByUrl(url: string): Promise<?RemotePortalAppEndpoint>;
    findAll(): Promise<Array<RemotePortalAppEndpoint>>;
    updateRemotePortalAppEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void>;
    refreshEndpointRegistration(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void>;
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
