// @flow

import type {
    ExpressErrorHandler,
    ExpressNextFunction,
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory
} from '../../type-definitions';

export default class DefaultExpressErrorHandler {

    _log: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._log = loggerFactory('mashroom.server');
    }

    handler(): ExpressErrorHandler {
        return (error: Error, req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            this._log.error('Unhandled error in a express controller. This is usually a programming mistake. \nContinuing but server might not work as expected.', error);

            // Continue
            next();
        };
    }

}
