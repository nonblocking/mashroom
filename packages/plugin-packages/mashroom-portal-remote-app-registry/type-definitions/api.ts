
import type {Request} from 'express';
import type {MashroomPortalApp} from '@mashroom/mashroom-portal/type-definitions';

export type InvalidRemotePortalApp = {
    readonly name: string;
    readonly error: string;
}

export type RemotePortalAppEndpoint = {
    readonly url: string;
    readonly sessionOnly: boolean;
    readonly lastError: string | null | undefined;
    readonly retries: number;
    readonly registrationTimestamp: number | null | undefined;
    readonly portalApps: Array<MashroomPortalApp>;
    readonly invalidPortalApps: Array<InvalidRemotePortalApp>;
};

export interface MashroomPortalRemoteAppEndpointService {
    /**
     * Register a new Remote App URL
     */
    registerRemoteAppUrl(url: string): Promise<void>;

    /**
     * Register a Remote App URL only for the current session (useful for testing)
     */
    synchronousRegisterRemoteAppUrlInSession(
        url: string,
        request: Request,
    ): Promise<void>;

    /**
     * Unregister a Remote App
     */
    unregisterRemoteAppUrl(url: string): Promise<void>;

    /**
     * Find Remote App by URL
     */
    findRemotePortalAppByUrl(
        url: string,
    ): Promise<RemotePortalAppEndpoint | null | undefined>;

    /**
     * Return all known Remote App endpoints
     */
    findAll(): Promise<Readonly<Array<RemotePortalAppEndpoint>>>;

    /**
     * Update an existing Remote App endpoint
     */
    updateRemotePortalAppEndpoint(
        remotePortalAppEndpoint: RemotePortalAppEndpoint,
    ): Promise<void>;

    /**
     * Refresh (fetch new metadata) from given endpoint
     */
    refreshEndpointRegistration(
        remotePortalAppEndpoint: RemotePortalAppEndpoint,
    ): Promise<void>;
}
