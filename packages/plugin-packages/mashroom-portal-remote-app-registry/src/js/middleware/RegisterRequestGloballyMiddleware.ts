
import {globalRequestHolder} from '../context';

import type {Request, Response, NextFunction, RequestHandler} from 'express';
import type {RegisterRequestGloballyMiddleware as RegisterRequestGloballyMiddlewareType} from '../../../type-definitions/internal';

export default class RegisterRequestGloballyMiddleware implements RegisterRequestGloballyMiddlewareType {

    middleware(): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction) => {
            // WARNING: The request will only be available for synchronous processing,
            // otherwise we would have to use something like request-context
            globalRequestHolder.request = req;
            res.on('finish', () => {
                globalRequestHolder.request = null;
            });

            next();
        };
    }
}
