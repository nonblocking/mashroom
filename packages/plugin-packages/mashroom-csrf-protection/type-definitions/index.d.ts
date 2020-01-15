/* eslint-disable */

import {ExpressRequest} from '@mashroom/mashroom/type-definitions';

// -------- Converted from api.js via https://flow-to-ts.netlify.com ----------

export interface MashroomCSRFService {
    /**
     * Get the current CSRF token for this session
     */
    getCSRFToken(request: ExpressRequest): string;

    /**
     * Check if the given token is valid
     */
    isValidCSRFToken(request: ExpressRequest, token: string): boolean;
}
