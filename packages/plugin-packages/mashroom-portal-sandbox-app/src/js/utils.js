// @flow

import type {PortalAppParams, PortalAppQueryParams, SelectedPortalApp} from '../../type-definitions';
import type {MashroomPortalStateService} from '@mashroom/mashroom-portal/type-definitions';

export const getQueryParams = (portalStateService: MashroomPortalStateService): PortalAppQueryParams => {
    const objParam = (key: string): ?{} => {
        const val = portalStateService.getStateProperty(key);
        if (!val) {
            return null;
        }
        try {
            return JSON.parse(atob(val));
        } catch (e) {
            console.error(`Invalid query parameter: ${key}=${val}`);
            return null;
        }
    };

    return {
        appName: portalStateService.getStateProperty('sbAppName'),
        preselectAppName: portalStateService.getStateProperty('sbPreselectAppName'),
        width: portalStateService.getStateProperty('sbWidth'),
        lang: portalStateService.getStateProperty('sbLang'),
        permissions: objParam('sbPermissions'),
        appConfig: objParam('sbAppConfig'),
    };
};

export const mergeAppConfig = (selectedPortalApp: SelectedPortalApp, params: PortalAppParams): SelectedPortalApp => {
    const {appName, setup} = selectedPortalApp;
    const {lang, permissions, appConfig} = params;

    return {
        appName,
        setup: {
            ...setup, lang: lang || '100%',
            user: {...setup.user, permissions: permissions || setup.user.permissions,},
            appConfig: appConfig || setup.appConfig,
        }
    };
};
