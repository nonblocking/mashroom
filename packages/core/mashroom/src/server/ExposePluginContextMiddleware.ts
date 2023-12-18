
import requestPluginContext from '../context/request-plugin-context';

import type {RequestHandler} from 'express';
import type {MashroomPluginContextHolder} from '../../type-definitions';

const PLUGIN_CONTEXT_PROPERTY_NAME = 'pluginContext';

export default class ExposePluginContextMiddleware {

    private readonly _pluginContextHolder: MashroomPluginContextHolder;

    constructor(pluginContextHolder: MashroomPluginContextHolder) {
        this._pluginContextHolder = pluginContextHolder;
    }

    middleware(): RequestHandler {
        return (req, res, next) => {
            req[PLUGIN_CONTEXT_PROPERTY_NAME] = requestPluginContext(req, this._pluginContextHolder);
            next();
        };
    }

}
