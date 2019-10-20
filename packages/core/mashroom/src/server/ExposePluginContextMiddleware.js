// @flow

import RequestLoggerContext from '../logging/context/RequestLoggerContext';

import type {NextFunction} from 'express';
import type {MashroomPluginContextHolder, ExpressMiddleware, MashroomPluginContext} from '../../type-definitions';

const PLUGIN_CONTEXT_PROPERTY_NAME = 'pluginContext';

export default class ExposePluginContextMiddleware {

    _pluginContextHolder: MashroomPluginContextHolder;

    constructor(pluginContextHolder: MashroomPluginContextHolder) {
        this._pluginContextHolder = pluginContextHolder;
    }

    middleware(): ExpressMiddleware {
        return (req, res, next: NextFunction) => {
            const pluginContext = this._pluginContextHolder.getPluginContext();
            const requestPluginContext: MashroomPluginContext = Object.freeze({
                serverInfo: pluginContext.serverInfo,
                serverConfig: pluginContext.serverConfig,
                loggerFactory: pluginContext.loggerFactory.bindToContext(new RequestLoggerContext(req)),
                services: pluginContext.services,
            });
            req[PLUGIN_CONTEXT_PROPERTY_NAME] = requestPluginContext;
            next();
        };
    }

}
