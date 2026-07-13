
import type {RequestHandler} from 'express';
import type {MashroomPluginContextHolder} from '../../type-definitions';

export default class XPoweredByHeaderMiddleware {

   private readonly _pluginContextHolder: MashroomPluginContextHolder;

    constructor(pluginContextHolder: MashroomPluginContextHolder) {
        this._pluginContextHolder = pluginContextHolder;
    }

    middleware(): RequestHandler {
        return (req, res, next) => {
            const serverConfig = this._pluginContextHolder.getPluginContext().serverConfig;
            if (serverConfig.xPoweredByHeader) {
                res.setHeader('X-Powered-By', serverConfig.xPoweredByHeader);
            }

            next();
        };
    }

}
