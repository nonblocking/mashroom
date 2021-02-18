
import type {RequestHandler} from 'express';

/**
 * Request handler wrapper that allows hot reload of a plugin
 */
export default class ExpressRequestHandlerWrapper {

    private _requestHandler: RequestHandler | undefined;

    constructor(private _pluginName: string) {
    }

    handler() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        // We create a handler with the name (function.name) pluginName.
        // The handler might receive three arguments (req, res, next) or four if it is an error handling middleware (err, req, res, next).
        // We pass just all arguments to the actual handler.

        const handlers = {
            [this._pluginName]: function(...args: any[]) {
                if (self._requestHandler) {
                    // @ts-ignore
                    self._requestHandler(...args);
                } else {
                    const next: () => void = args[args.length - 1];
                    next();
                }
            },
        };


        return handlers[this._pluginName];
    }

    updateRequestHandler(requestHandler: RequestHandler) {
        this._requestHandler = requestHandler;
    }
}
