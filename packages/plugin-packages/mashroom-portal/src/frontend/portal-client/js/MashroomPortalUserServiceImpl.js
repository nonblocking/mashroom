// @flow
/* eslint no-unused-vars: off */

import {
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_LANGUAGE
} from '../../../backend/constants';

import type {MashroomPortalUserService, MashroomRestService} from '../../../../type-definitions';

export default class MashroomPortalAppServiceImpl implements MashroomPortalUserService {

    _restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = global[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
    }

    logout() {
        const path = '/logout';
        return this._restService.get(path).then(
            () => {
                this._reloadPage();
                return Promise.resolve();
            }
        );
    }

    getUserLanguage() {
        return window[WINDOW_VAR_PORTAL_LANGUAGE];
    }

    setUserLanguage(lang: string) {
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

    getAvailableLanguages() {
        const path = '/languages';
        return this._restService.get(path);
    }

    getDefaultLanguage() {
        const path = '/languages/default';
        return this._restService.get(path);
    }

    _reloadPage() {
        window.location.reload(true);
    }
}
