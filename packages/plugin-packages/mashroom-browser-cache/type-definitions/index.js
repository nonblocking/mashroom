// @flow

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';

export type CachingPolicy = 'ALWAYS' | 'NEVER' | 'ONLY_FOR_ANONYMOUS_USERS';

export interface MashroomCacheControlService {
    /**
     * Add the Cache-Control header based on the policy and authentication status.
     */
    addCacheControlHeader(cachingPolicy: CachingPolicy, request: ExpressRequest, response: ExpressResponse): void;

    /**
     * Remove a previously set Cache-Control header
     */
    removeCacheControlHeader(response: ExpressResponse): void;

}
