// @flow

import type {NextFunction} from 'express';
import type {MashroomPluginContextHolder, ExpressMiddleware} from '../../type-definitions';

const PLUGIN_CONTEXT_PROPERTY_NAME = 'pluginContext';

export default class ExposePluginContextMiddleware {

    _pluginContextHolder: MashroomPluginContextHolder;

    constructor(pluginContextHolder: MashroomPluginContextHolder) {
        this._pluginContextHolder = pluginContextHolder;
    }

    middleware(): ExpressMiddleware {
        return (req, res, next: NextFunction) => {
            req[PLUGIN_CONTEXT_PROPERTY_NAME] = this._pluginContextHolder.getPluginContext();
            next();
        };
    }

}
