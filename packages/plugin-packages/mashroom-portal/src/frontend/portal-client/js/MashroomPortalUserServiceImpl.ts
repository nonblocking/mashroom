
import {
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_LANGUAGE
} from '../../../backend/constants';
import {HEADER_DO_NOT_EXTEND_SESSION} from './headers';

import type {RestError} from './RestError';
import type {MashroomPortalUserService} from '../../../../type-definitions';
import type {MashroomRestService} from '../../../../type-definitions/internal';

export default class MashroomPortalAppServiceImpl implements MashroomPortalUserService {

    private _restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
    }

    async getAuthenticationExpiration(): Promise<number | null> {
        const path = '/users/authenticated/authExpiration';
        try {
            const data = await this._restService.get(path, {
                [HEADER_DO_NOT_EXTEND_SESSION]: '1'
            });

            if (data?.expirationTime) {
                return data.expirationTime;
            }

            console.error('Expiration check failed because the received data is invalid:', data);
            return null;
        } catch (error: any) {
            console.error('Expiration check failed:', error);
            if (error.getStatusCode?.() === 403) {
                return 0;
            }
            return null;
        }
    }

    async getTimeToAuthenticationExpiration(): Promise<number | null> {
        const path = '/users/authenticated/timeToAuthExpiration';
        try {
            const data = await this._restService.get(path, {
                [HEADER_DO_NOT_EXTEND_SESSION]: '1'
            });

            if (data?.timeToExpiration) {
                return data.timeToExpiration;
            }

            console.error('Expiration check failed because the received data is invalid:', data);
            return null;
        } catch (error: any) {
            console.warn('Expiration check failed:', error);
            if (error.getStatusCode?.() === 403) {
                return 0;
            }
            return null;
        }
    }

    extendAuthentication(): void {
        // For the moment: Just request the authentication expiration without the x-mashroom-no-extend-session header
        const path = '/users/authenticated/authExpiration';
        this._restService.get(path);
    }

    async logout(): Promise<void> {
        const path = '/logout';
        try {
            await this._restService.get(path);
        } catch (error) {
            console.info('Logout failed', error);
        }
        // Try to reload anyway, regardless of success or failure
        this._reloadPage();
    }

    getUserLanguage(): string {
        return (global as any)[WINDOW_VAR_PORTAL_LANGUAGE];
    }

    async setUserLanguage(lang: string): Promise<void> {
        const path = '/users/authenticated/lang';
        const data = {
            lang
        };
        await this._restService.put(path, data);
        this._reloadPage();
    }

    getAvailableLanguages(): Promise<Array<string>> {
        const path = '/languages';
        return this._restService.get(path);
    }

    getDefaultLanguage(): Promise<string> {
        const path = '/languages/default';
        return this._restService.get(path);
    }

    private _reloadPage() {
        global.location.reload();
    }
}
