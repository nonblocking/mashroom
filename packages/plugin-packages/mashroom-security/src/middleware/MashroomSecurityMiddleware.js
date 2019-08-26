// @flow

import type {MashroomLogger, MashroomLoggerFactory, ExpressRequest, ExpressResponse, ExpressNextFunction} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityMiddleware as MashroomSecurityMiddlewareType, MashroomSecurityService} from '../../type-definitions';

const HEADER_DOES_NOT_EXTEND_AUTHENTICATION = 'x-mashroom-does-not-extend-auth';

export default class MashroomSecurityMiddleware implements MashroomSecurityMiddlewareType {

    _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.security.middleware');
    }

    async refreshAuthentication(securityService: MashroomSecurityService, req: ExpressRequest) {
        if (!req.headers[HEADER_DOES_NOT_EXTEND_AUTHENTICATION]) {
            await securityService.refreshAuthentication(req);
        }
    }

    middleware() {
        return async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {

            try {
                const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
                const allowed = await securityService.checkACL(req);

                if (!allowed) {
                    const user = securityService.getUser(req);
                    if (!user) {
                        // Authenticate
                        const result = await securityService.authenticate(req, res);
                        if (result.status === 'authenticated') {
                            const isAllowedNow = await securityService.checkACL(req);
                            if (isAllowedNow) {
                                next();
                                return;
                            }
                        } else if (result.status === 'deferred' || res.statusCode === 302) {
                            // Most likely a redirect to the login page
                            return;
                        } else {
                            this._logger.error('Security service return status error');
                        }
                    }
                } else {
                    await this.refreshAuthentication(securityService, req);
                    next();
                    return;
                }
            } catch (e) {
                this._logger.error('Checking ACL failed. Denying access.', e);
            }

            // Deny
            res.sendStatus(403);
        };
    }
}
