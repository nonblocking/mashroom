
import type {Request, Response} from 'express';

export interface MashroomCacheControlService {
    /**
     * Add the Cache-Control header based on the settings and authentication status.
     * The resourceCanContainSensitiveInformation parameter defines if the resource could contain some sensitive user data
     * and the caching should be disabled if a user is authenticated.
     */
    addCacheControlHeader(
        resourceCanContainSensitiveInformation: boolean,
        request: Request,
        response: Response,
    ): Promise<void>;

    /**
     * Remove a previously set Cache-Control header
     */
    removeCacheControlHeader(response: Response): void;
}
