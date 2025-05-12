
import {
    QUERY_PARAM_APP_CONFIG,
    QUERY_PARAM_APP_NAME, QUERY_PARAM_E2E_TEST,
    QUERY_PARAM_LANG,
    QUERY_PARAM_PERMISSIONS,
    QUERY_PARAM_PRESELECT_APP_NAME,
    QUERY_PARAM_WIDTH
} from './constants';
import type {MashroomPortalStateService} from '@mashroom/mashroom-portal/type-definitions';
import type {PortalAppParams, PortalAppQueryParams, SelectedPortalApp} from './types';

export const getQueryParams = (portalStateService: MashroomPortalStateService): PortalAppQueryParams => {
    const objParam = (key: string): any | undefined => {
        const val = portalStateService.getStateProperty(key);
        if (!val) {
            return null;
        }
        try {
            return JSON.parse(atob(val));
        } catch {
            console.error(`Invalid query parameter: ${key}=${val}`);
            return null;
        }
    };

    return {
        appName: portalStateService.getStateProperty(QUERY_PARAM_APP_NAME),
        preselectAppName: portalStateService.getStateProperty(QUERY_PARAM_PRESELECT_APP_NAME),
        width: portalStateService.getStateProperty(QUERY_PARAM_WIDTH),
        lang: portalStateService.getStateProperty(QUERY_PARAM_LANG),
        permissions: objParam(QUERY_PARAM_PERMISSIONS),
        appConfig: objParam(QUERY_PARAM_APP_CONFIG),
        autoTest: !!portalStateService.getStateProperty(QUERY_PARAM_E2E_TEST),
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
