
import {
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_LANGUAGE
} from '../../../backend/constants';

import type {MashroomPortalUserService, MashroomRestService} from '../../../../type-definitions';

export default class MashroomPortalAppServiceImpl implements MashroomPortalUserService {

    private _restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
    }

    getAuthenticationExpiration(): Promise<number | null | undefined> {
        const path = '/users/authenticated/authExpiration';
        return this._restService.get(path, {
            'x-mashroom-does-not-extend-auth': '1'
        }).then(
            (data) => {
                if (data && data.expirationTime) {
                    return Promise.resolve(data.expirationTime);
                }
                return Promise.resolve(null);
            },
            () => {
                return Promise.resolve(null);
            }
        );
    }

    extendAuthentication(): void {
        // For the moment: Just request the authentication expiration without the x-mashroom-does-not-extend-auth header
        const path = '/users/authenticated/authExpiration';
        this._restService.get(path);
    }

    logout(): Promise<void> {
        const path = '/logout';
        return this._restService.get(path).then(
            () => {
                this._reloadPage();
                return Promise.resolve();
            },
            (error) => {
                console.error('Logout failed', error);
                // Try to reload anyway
                this._reloadPage();
                return Promise.resolve();
            }
        );
    }

    getUserLanguage(): string {
        return (global as any)[WINDOW_VAR_PORTAL_LANGUAGE];
    }

    setUserLanguage(lang: string): Promise<void> {
        const path = '/users/authenticated/lang';
        const data = {
            lang
        };
        return this._restService.put(path, data).then(
            () => {
                this._reloadPage();
                return Promise.resolve();
            }
        );
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
        global.location.reload(true);
    }
}
