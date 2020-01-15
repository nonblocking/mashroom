// @flow

import type {ExpressMiddleware} from '@mashroom/mashroom/type-definitions';

export interface MashroomCSRFMiddleware {
    middleware(): ExpressMiddleware
}
