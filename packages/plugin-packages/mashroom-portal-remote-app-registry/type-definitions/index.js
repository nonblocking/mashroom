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
    /**
     * Register a new Remote App URL
     */
    registerRemoteAppUrl(url: string): Promise<void>;
    /**
     * Register a Remote App URL only for the current session (useful for testing)
     */
    synchronousRegisterRemoteAppUrlInSession(url: string, request: ExpressRequest): Promise<void>;
    /**
     * Unregister a Remote App
     */
    unregisterRemoteAppUrl(url: string): Promise<void>;
    /**
     * Find Remote App by URL
     */
    findRemotePortalAppByUrl(url: string): Promise<?RemotePortalAppEndpoint>;
    /**
     * Return all known Remote App endpoints
     */
    findAll(): Promise<Array<RemotePortalAppEndpoint>>;
    /**
     * Update an existing Remote App endpoint
     */
    updateRemotePortalAppEndpoint(remotePortalAppEndpoint: RemotePortalAppEndpoint): Promise<void>;
    /**
     * Refresh (fetch new metadata) from given endpoint
     */
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
