// @flow

import {globalRequestHolder} from '../context';

import type {MashroomLogger, MashroomLoggerFactory, ExpressRequest, ExpressResponse, ExpressNextFunction} from '@mashroom/mashroom/type-definitions';
import type {RegisterRequestGloballyMiddleware as RegisterRequestGloballyMiddlewareType} from '../../../type-definitions';

export default class RegisterRequestGloballyMiddleware implements RegisterRequestGloballyMiddlewareType {

    _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.remoteAppRegistry');
    }

    middleware() {
        return async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            globalRequestHolder.request = req;
            res.on('finish', () => {
                globalRequestHolder.request = null;
            });

            next();
        };
    }
}
