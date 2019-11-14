// @flow

import {userContext} from '@mashroom/mashroom-utils/lib/logging_utils';

import type {
    ExpressRequest,
    ExpressResponse,
    ExpressNextFunction,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityMiddleware as MashroomSecurityMiddlewareType,
    MashroomSecurityService,
    MashroomSecurityUser
} from '../../type-definitions';

const HEADER_DOES_NOT_EXTEND_AUTHENTICATION = 'x-mashroom-does-not-extend-auth';

const addUserToLogContext = (user: ?MashroomSecurityUser, logger: MashroomLogger) => {
    if (user) {
        logger.addContext(userContext(user));
    }
};

export default class MashroomSecurityMiddleware implements MashroomSecurityMiddlewareType {

    async checkAuthentication(securityService: MashroomSecurityService, req: ExpressRequest) {
        if (securityService.isAuthenticated(req) && !req.headers[HEADER_DOES_NOT_EXTEND_AUTHENTICATION]) {
            await securityService.checkAuthentication(req);
        }
    }

    middleware() {
        return async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.security.middleware');
            let allowed = false;

            try {
                const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

                await this.checkAuthentication(securityService, req);

                const user = securityService.getUser(req);
                addUserToLogContext(user, logger);
                allowed = await securityService.checkACL(req);

                if (!allowed && !user) {
                    // Try authenticate
                    const result = await securityService.authenticate(req, res);
                    if (result.status === 'authenticated') {
                        addUserToLogContext(securityService.getUser(req), logger);
                        allowed = await securityService.checkACL(req);
                    } else if (result.status === 'deferred' || res.statusCode === 302) {
                        // Most likely a redirect to the login page
                        return;
                    } else {
                        logger.error('Security service return status error');
                    }
                }

            } catch (e) {
                logger.error('Checking ACL failed. Denying access.', e);
            }

            if (allowed) {
                next();
            } else if (!res.headersSent) {
                res.sendStatus(403);
            }
        };
    }
}
