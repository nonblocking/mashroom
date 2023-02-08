
import {userContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import {isStaticResourceRequest} from '@mashroom/mashroom-utils/lib/request_utils';

import type {Request, Response, NextFunction} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityService,
    MashroomSecurityUser
} from '../../type-definitions';
import type {
    MashroomSecurityMiddleware as MashroomSecurityMiddlewareType,
} from '../../type-definitions/internal';

const HEADER_DO_NOT_EXTEND_SESSION = 'x-mashroom-no-extend-session';

const addUserToLogContext = (user: MashroomSecurityUser | undefined | null, logger: MashroomLogger) => {
    if (user) {
        logger.addContext(userContext(user));
    }
};

export default class MashroomSecurityMiddleware implements MashroomSecurityMiddlewareType {

    middleware() {
        return async (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
            const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.security.middleware');
            let allowed = false;

            try {
                const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;

                await this._checkAuthentication(securityService, req);

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
                    }
                }

                if (allowed && !user) {
                    // Try to authenticate on public pages if this is possible without user interaction
                    await this._authenticateIfPossibleWithoutUserInteraction(securityService, logger, req, res);
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

    private async _checkAuthentication(securityService: MashroomSecurityService, req: Request): Promise<void> {
        // We only want to (re-)check the authentication if this is "real" user request and not a resource
        //  or a request that contains the header x-mashroom-no-extend-session (because checkAuthentication typically also extends the session).
        // The main reason is performance but also caching, since updating the session always adds the set-cookie header to the response
        //  and proxies refuse to cache responses which contain that header.
        if (securityService.isAuthenticated(req) && !isStaticResourceRequest(req) && !req.headers[HEADER_DO_NOT_EXTEND_SESSION]) {
            await securityService.checkAuthentication(req);
        }
    }

    private async _authenticateIfPossibleWithoutUserInteraction(securityService: MashroomSecurityService, logger: MashroomLogger, req: Request, res: Response): Promise<void> {
        try {
            if (await securityService.canAuthenticateWithoutUserInteraction(req)) {
                const responseProxy = this._createResponseProxyWithDisabledRedirect(res);
                await securityService.authenticate(req, responseProxy);
            }
        } catch (e) {
            logger.error('Authentication without user interaction failed!', e);
        }
    }

    private _createResponseProxyWithDisabledRedirect(res: Response): Response {
        const responseProxyHandler: ProxyHandler<any> = {
            get(target, key, receiver) {
                const prop = Reflect.get(target, key, receiver);
                if (typeof(prop) === 'function') {
                    if (key === 'redirect') {
                        throw new Error('Using res.redirect() is not allowed when canAuthenticateWithoutUserInteraction() returned true');
                    }
                    return function (...args: any[]) {
                        // @ts-ignore
                        return prop.apply(this, args);
                    };
                }

                return prop;
            }
        };

        return new Proxy(res, responseProxyHandler);
    }
}
