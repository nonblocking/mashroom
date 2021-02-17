
import type {NextFunction} from 'express';
import type {ExpressMiddleware, MashroomPluginContextHolder} from '../../type-definitions';

export default class XPoweredByHeaderMiddleware {

    _pluginContextHolder: MashroomPluginContextHolder;

    constructor(pluginContextHolder: MashroomPluginContextHolder) {
        this._pluginContextHolder = pluginContextHolder;
    }

    middleware(): ExpressMiddleware {
        return (req, res, next: NextFunction) => {
            const serverConfig = this._pluginContextHolder.getPluginContext().serverConfig;
            if (serverConfig.xPowerByHeader) {
                res.setHeader('X-Powered-By', serverConfig.xPowerByHeader);
            }

            next();
        };
    }

}
