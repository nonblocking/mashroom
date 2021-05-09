
import type {Request, Response} from 'express';

export type CachingPolicy = 'ALWAYS' | 'NEVER' | 'ONLY_FOR_ANONYMOUS_USERS';

export interface MashroomCacheControlService {
    /**
     * Add the Cache-Control header based on the policy and authentication status.
     */
    addCacheControlHeader(cachingPolicy: CachingPolicy, request: Request, response: Response): void;

    /**
     * Remove a previously set Cache-Control header
     */
    removeCacheControlHeader(response: Response): void;
}
