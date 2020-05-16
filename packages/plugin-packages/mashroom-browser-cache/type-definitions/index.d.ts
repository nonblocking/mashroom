/* eslint-disable */

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';

export interface MashroomCacheControlService {
    /**
     * Add the Cache-Control header based on the settings and authentication status
     */
    addCacheControlHeader(
        request: ExpressRequest,
        response: ExpressResponse,
    ): Promise<void>;

    /**
     * Remove a previously set Cache-Control header
     */
    removeCacheControlHeader(response: ExpressResponse): void;
}
