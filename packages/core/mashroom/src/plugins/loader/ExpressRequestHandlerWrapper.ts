
import type {Request, Response, NextFunction, RequestHandler} from 'express';

/**
 * Request handler wrapper that allows hot reload of a plugin
 */
export default class ExpressRequestHandlerWrapper {

    private _requestHandler: RequestHandler | undefined;

    constructor(private _pluginName: string) {
    }

    handler(): RequestHandler {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        // We create a handler with the name (function.name) pluginName.
        const handlers = {
            [this._pluginName]: function(req: Request, res: Response, next: NextFunction) {
                if (self._requestHandler) {
                    self._requestHandler(req, res, next);
                } else {
                    next();
                }
            },
        };


        return handlers[this._pluginName];
    }

    updateRequestHandler(requestHandler: RequestHandler): void {
        this._requestHandler = requestHandler;
    }
}
