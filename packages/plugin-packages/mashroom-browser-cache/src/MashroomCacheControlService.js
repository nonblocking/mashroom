// @flow

import type {
    ExpressRequest, ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomCacheControlService as MashroomCacheControlServiceType} from '../type-definitions';

const CACHE_CONTROL_HEADER_NAME = 'Cache-Control';

export default class MashroomCacheControlService implements MashroomCacheControlServiceType {

    _disabled: boolean;
    _disabledWhenAuthenticated: boolean;
    _maxAgeSec: number;
    _logger: MashroomLogger;

    constructor(devMode: boolean, disabled: boolean, disabledWhenAuthenticated: boolean, maxAgeSec: number, loggerFactory: MashroomLoggerFactory) {
        this._disabled = disabled;
        this._disabledWhenAuthenticated = disabledWhenAuthenticated;
        this._maxAgeSec = maxAgeSec;
        this._logger = loggerFactory('mashroom.browserCache.service');
        if (devMode) {
            this._logger.info('Disabling browser cache because some packages are in dev mode');
            this._disabled = true;
        }
    }

    async addCacheControlHeader(request: ExpressRequest, response: ExpressResponse) {
        if (request.method !== 'GET') {
            this._logger.warn(`Browser caching not possible for ${request.method} requests`);
            return;
        }

        if (this._disabled) {
            response.set(CACHE_CONTROL_HEADER_NAME, 'no-cache, no-store, must-revalidate');
            return;
        }

        let publicResource = true;
        const securityService: ?MashroomSecurityService = request.pluginContext.services.security && request.pluginContext.services.security.service;
        if (securityService) {
            const user = securityService.getUser(request);
            const authenticated = !!user;
            if (this._disabledWhenAuthenticated && authenticated) {
                response.set(CACHE_CONTROL_HEADER_NAME, 'no-cache, no-store, must-revalidate');
                return;
            }

            publicResource = !authenticated;
        }

        response.set(CACHE_CONTROL_HEADER_NAME, `${publicResource ? 'public' : 'private'}, max-age=${this._maxAgeSec}`);
    }

    removeCacheControlHeader(response: ExpressResponse) {
        response.removeHeader(CACHE_CONTROL_HEADER_NAME);
    }

}
