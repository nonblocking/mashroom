// @flow

import type {ExpressRequestHandler} from '../../../type-definitions';

/**
 * Request handler wrapper that allows hot reload of a plugin
 */
export default class ExpressRequestHandlerWrapper {

    _requestHandler: ?ExpressRequestHandler;

    _pluginName: string;

    constructor(pluginName: string) {
        this._pluginName = pluginName;
    }

    handler() {
        const self = this;

        // We create a handler with the name (function.name) pluginName.
        // The handler might receive three arguments (req, res, next) or four if it is an error handling middleware (err, req, res, next).
        // We pass just all arguments to the actual handler.

        const handlers = {
            [this._pluginName]: function(...args: any[]) {
                if (self._requestHandler) {
                    self._requestHandler(...args);
                } else {
                    const next: () => void = args[args.length - 1];
                    next();
                }
            },
        };


        return handlers[this._pluginName];
    }

    updateRequestHandler(requestHandler: ExpressRequestHandler) {
        this._requestHandler = requestHandler;
    }
}
