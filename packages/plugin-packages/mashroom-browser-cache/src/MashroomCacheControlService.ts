
import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomCacheControlService as MashroomCacheControlServiceType} from '../type-definitions';

const CACHE_CONTROL_HEADER_NAME = 'Cache-Control';

export default class MashroomCacheControlService implements MashroomCacheControlServiceType {

    private disabled: boolean;

    constructor(devMode: boolean, disabled: boolean, private maxAgeSec: number, loggerFactory: MashroomLoggerFactory) {
        this.disabled = disabled;
        const logger = loggerFactory('mashroom.browserCache.service');
        if (devMode) {
            logger.info('Disabling browser cache because some packages are in dev mode');
            this.disabled = true;
        }
    }

    async addCacheControlHeader(resourceCanContainSensitiveInformation: boolean, request: ExpressRequest, response: ExpressResponse): Promise<void> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.browserCache.service');

        if (request.method !== 'GET') {
            logger.warn(`Browser caching not possible for ${request.method} requests`);
            return;
        }

        if (this.disabled) {
            this._disableCache(response);
            return;
        }

        let publicResource = true;
        const securityService: MashroomSecurityService | undefined = request.pluginContext.services.security && request.pluginContext.services.security.service;
        if (securityService) {
            const user = securityService.getUser(request);
            const authenticated = !!user;
            publicResource = !authenticated;

            if (resourceCanContainSensitiveInformation && authenticated) {
                this._disableCache(response);
                return;
            }
        }

        response.set(CACHE_CONTROL_HEADER_NAME, `${publicResource ? 'public' : 'private'}, max-age=${this.maxAgeSec}`);
    }

    removeCacheControlHeader(response: ExpressResponse): void {
        response.removeHeader(CACHE_CONTROL_HEADER_NAME);
    }

    private _disableCache(res: ExpressResponse) {
        res.set(CACHE_CONTROL_HEADER_NAME, 'no-cache, no-store, max-age=0');
        // Older clients
        res.set('Pragma', 'no');
    }

}
