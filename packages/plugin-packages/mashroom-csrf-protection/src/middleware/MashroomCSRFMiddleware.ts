

import {MashroomLogger, MashroomLoggerFactory, ExpressRequest, ExpressResponse, ExpressNextFunction} from '@mashroom/mashroom/type-definitions';
import {MashroomCSRFService} from '../../type-definitions';


// @ts-ignore
import {MashroomCSRFMiddleware as MashroomCSRFMiddlewareType} from '../../type-definitions/internal';

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_QUERY_PARM_NAME = 'csrfToken';

export default class MashroomCSRFMiddleware implements MashroomCSRFMiddlewareType {

    _safeMethods: Array<string>;

    constructor(safeMethods: Array<string>) {
        this._safeMethods = safeMethods;
    }

    middleware() {
        return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            if (this._safeMethods.find((m) => m === req.method)) {
                next();
                return;
            }

            const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.csrf.middleware');

            try {
                const csrfService: MashroomCSRFService = req.pluginContext.services.csrf.service;

                let token = req.query && req.query[CSRF_QUERY_PARM_NAME];
                if (!token) {
                    token = req.get(CSRF_HEADER_NAME);
                }

                logger.debug(`Checking CSRF token for request ${req.method} ${req.originalUrl}: ${token || '<none>'}`);

                if (!token) {
                    logger.error(`Rejecting request without CSRF token ${req.method} ${req.originalUrl}`);
                    res.sendStatus(403);
                    return;
                }

                if (!csrfService.isValidCSRFToken(req, token)) {
                    logger.error(`Rejecting request with invalid CSRF token ${req.method} ${req.originalUrl}`);
                    res.sendStatus(403);
                    return;
                }

                // Success
                next();

            } catch (error) {
                logger.error('Checking CSRF token failed', error);
                res.sendStatus(500);
            }
        };
    }

}
