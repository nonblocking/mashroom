
import {mashroomPortalCommonsCombineReducers} from '@mashroom/mashroom-portal-ui-commons';

import type {Reducer} from 'redux';
import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme
} from '@mashroom/mashroom-portal/type-definitions';
import type {
    State,
    AvailableApps,
    Languages,
    Pages,
    SelectedPage,
    SelectedPortalApp,
    SelectedSite,
    Sites,
    User
} from '../types';
import type {
    SetAvailableAppsAction,
    SetAvailableAppsErrorAction,
    SetAvailableAppsLoadingAction,
    SetAvailableLanguagesAction,
    SetAvailableLayoutsAction,
    SetAvailableThemesAction,
    SetCurrentLanguageAction,
    SetDefaultLanguageAction,
    SetExistingRolesAction,
    SetPagesAction,
    SetPagesErrorAction,
    SetPagesFlattenedAction,
    SetPagesLoadingAction,
    SetSelectdPageLoadingAction,
    SetSelectedPageAction,
    SetSelectedPageDataAction,
    SetSelectedPageLoadingErrorAction,
    SetSelectedPageNewAction,
    SetSelectedPagePermittedRolesAction,
    SetSelectedPageRefDataAction,
    SetSelectedPageUpdatingErrorAction,
    SetSelectedPortalAppAction,
    SetSelectedPortalAppLoadingAction,
    SetSelectedPortalAppLoadingErrorAction,
    SetSelectedPortalAppPermittedRolesAction,
    SetSelectedPortalAppUpdatingErrorAction,
    SetSelectedSiteAction,
    SetSelectedSiteDataAction,
    SetSelectedSiteLoadingAction,
    SetSelectedSiteLoadingErrorAction,
    SetSelectedSiteNewAction,
    SetSelectedSitePermittedRolesAction,
    SetSelectedSiteUpdatingErrorAction,
    SetShowPortalAppControls,
    SetSitesAction,
    SetSitesErrorAction,
    SetSitesLoadingAction,
    SetUserNameAction
} from './actions';

const user: Reducer<User, SetUserNameAction> = (state, action) => {
    if (!state) {
        return {
            userName: null,
        };
    }

    switch (action.type) {
        case 'SET_USER_NAME': {
            return {...state, userName: action.userName};
        }
        default:
            return state;
    }
};

const languages: Reducer<Languages,SetCurrentLanguageAction | SetDefaultLanguageAction | SetAvailableLanguagesAction> = (state, action) => {
    if (!state) {
        return {
            current: 'en',
            default: 'en',
            available: []
        };
    }

    switch (action.type) {
        case 'SET_CURRENT_LANGUAGE':
            return {...state, current: action.lang};
        case 'SET_DEFAULT_LANGUAGE':
            return {...state, default: action.lang};
        case 'SET_AVAILABLE_LANGUAGES':
            return {...state, available: action.languages};
        default:
            return state;
    }
};

const existingRoles: Reducer<Array<string>, SetExistingRolesAction> = (state, action) => {
    if (!state) {
        return [];
    }

    switch (action.type) {
        case 'SET_EXISTING_ROLES':
            return action.roles;
        default:
            return state;
    }
};

const availableThemes: Reducer<Array<MashroomAvailablePortalTheme>, SetAvailableThemesAction> = (state, action) => {
    if (!state) {
        return [];
    }

    switch (action.type) {
        case 'SET_AVAILABLE_THEMES':
            return action.themes;
        default:
            return state;
    }
};

const availableLayouts: Reducer<Array<MashroomAvailablePortalLayout>, SetAvailableLayoutsAction> = (state, action) => {
    if (!state) {
        return [];
    }

    switch (action.type) {
        case 'SET_AVAILABLE_LAYOUTS':
            return action.layouts;
        default:
            return state;
    }
};

const sites: Reducer<Sites, SetSitesAction | SetSitesLoadingAction | SetSitesErrorAction> = (state, action) => {
    if (!state) {
        return {
            loading: false,
            error: false,
            sites: []
        };
    }

    switch (action.type) {
        case 'SET_SITES':
            return {...state, sites: action.sites};
        case 'SET_SITES_LOADING':
            return {...state, loading: action.loading};
        case 'SET_SITES_ERROR':
            return {...state, error: action.error};
        default:
            return state;
    }
};

const pages: Reducer<Pages, SetPagesAction | SetPagesFlattenedAction | SetPagesLoadingAction | SetPagesErrorAction> = (state, action) => {
    if (!state) {
        return {
            loading: false,
            error: false,
            pages: [],
            pagesFlattened: []
        };
    }

    switch (action.type) {
        case 'SET_PAGES':
            return {...state, pages: action.pages};
        case 'SET_PAGES_FLATTENED':
            return {...state, pagesFlattened: action.pages};
        case 'SET_PAGES_LOADING':
            return {...state, loading: action.loading};
        case 'SET_PAGES_ERROR':
            return {...state, error: action.error};
        default:
            return state;
    }
};

const portalAppControls: Reducer<boolean, SetShowPortalAppControls> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return true;
    }

    switch (action.type) {
        case 'SET_SHOW_PORTAL_APP_CONTROLS': {
            return action.show;
        }
        default:
            return state;
    }
};

const availableApps: Reducer<AvailableApps, SetAvailableAppsLoadingAction | SetAvailableAppsErrorAction | SetAvailableAppsAction> = (state, action) => {
    if (!state) {
        return {
            loading: false,
            error: false,
            apps: null
        };
    }

    switch (action.type) {
        case 'SET_AVAILABLE_APPS_LOADING': {
            return {...state, loading: action.loading};
        }
        case 'SET_AVAILABLE_APPS_ERROR': {
            return {...state, error: action.error};
        }
        case 'SET_AVAILABLE_APPS': {
            return {...state, apps: action.apps};
        }
        default:
            return state;
    }
};

const selectedPortalApp: Reducer<
    SelectedPortalApp | undefined | null,
    SetSelectedPortalAppAction | SetSelectedPortalAppLoadingAction | SetSelectedPortalAppLoadingErrorAction | SetSelectedPortalAppUpdatingErrorAction | SetSelectedPortalAppPermittedRolesAction
> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case 'SET_SELECTED_PORTAL_APP': {
            return {
                ...state,
                selectedTs: Date.now(),
                loadedAppId: action.loadedAppId,
                portalAppName: action.portalAppName,
                instanceId: action.instanceId,
                loading: true,
                customConfigEditor: action.customConfigEditor,
                errorLoading: false,
                errorUpdating: false,
                permittedRoles: null
            };
        }
        case 'SET_SELECTED_PORTAL_APP_LOADING':
            if (!state) {
                return null;
            }
            return {...state, loading: action.loading};
        case 'SET_SELECTED_PORTAL_APP_LOADING_ERROR':
            if (!state) {
                return null;
            }
            return {
                ...state,
                loading: false,
                errorLoading: action.error
            };
        case 'SET_SELECTED_PORTAL_APP_UPDATING_ERROR': {
            if (!state) {
                return null;
            }
            return {...state, errorUpdating: action.error};
        }
        case 'SET_SELECTED_PORTAL_APP_PERMITTED_ROLES':
            if (!state) {
                return null;
            }
            return {...state, permittedRoles: action.roles};
        default:
            return state;
    }
};

const selectedPage: Reducer<
    SelectedPage | undefined | null,
    SetSelectedPageAction | SetSelectedPageNewAction | SetSelectdPageLoadingAction | SetSelectedPageLoadingErrorAction | SetSelectedPageUpdatingErrorAction
    | SetSelectedPageRefDataAction | SetSelectedPageDataAction | SetSelectedPagePermittedRolesAction
> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case 'SET_SELECTED_PAGE': {
            return {
                ...state,
                selectedTs: Date.now(),
                pageId: action.pageId,
                loading: true,
                errorLoading: false,
                errorUpdating: false,
                page: null,
                pageRef: null,
                permittedRoles: null
            };
        }
        case 'SET_SELECTED_PAGE_NEW': {
            return {
                ...state,
                selectedTs: Date.now(),
                pageId: null,
                loading: false,
                errorLoading: false,
                errorUpdating: false,
                page: null,
                pageRef: null,
                permittedRoles: null
            };
        }
        case 'SET_SELECTED_PAGE_LOADING':
            if (!state) {
                return null;
            }
            return {
                ...state,
                loading: action.loading,
                errorLoading: false
            };
        case 'SET_SELECTED_PAGE_LOADING_ERROR':
            if (!state) {
                return null;
            }
            return {
                ...state,
                loading: false,
                errorLoading: action.error
            };
        case 'SET_SELECTED_PAGE_UPDATING_ERROR': {
            if (!state) {
                return null;
            }
            return {...state, errorUpdating: action.error};
        }
        case 'SET_SELECTED_PAGE_DATA':
            if (!state) {
                return null;
            }
            return {...state, page: action.page};
        case 'SET_SELECTED_PAGE_REF_DATA':
            if (!state) {
                return null;
            }
            return {...state, pageRef: action.pageRef};
        case 'SET_SELECTED_PAGE_PERMITTED_ROLES':
            if (!state) {
                return null;
            }
            return {...state, permittedRoles: action.roles};
        default:
            return state;
    }
};

const selectedSite: Reducer<
    SelectedSite | undefined | null,
    SetSelectedSiteAction | SetSelectedSiteNewAction | SetSelectedSiteLoadingAction | SetSelectedSiteLoadingErrorAction | SetSelectedSiteUpdatingErrorAction
    | SetSelectedSiteDataAction | SetSelectedSitePermittedRolesAction
> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case 'SET_SELECTED_SITE': {
            return {
                ...state, selectedTs: Date.now(),
                siteId: action.siteId,
                loading: true,
                errorLoading: false,
                errorUpdating: false,
                site: null,
                permittedRoles: null
            };
        }
        case 'SET_SELECTED_SITE_NEW': {
            return {
                ...state, selectedTs: Date.now(),
                siteId: null,
                loading: false,
                errorLoading: false,
                errorUpdating: false,
                site: null,
                permittedRoles: null
            };
        }
        case 'SET_SELECTED_SITE_LOADING':
            if (!state) {
                return null;
            }
            return {...state, loading: action.loading};
        case 'SET_SELECTED_SITE_LOADING_ERROR':
            if (!state) {
                return null;
            }
            return {
                ...state,
                loading: false,
                errorLoading: action.error
            };
        case 'SET_SELECTED_SITE_UPDATING_ERROR': {
            if (!state) {
                return null;
            }
            return {...state, errorUpdating: action.error};
        }
        case 'SET_SELECTED_SITE_DATA':
            if (!state) {
                return null;
            }
            return {...state, site: action.site};
        case 'SET_SELECTED_SITE_PERMITTED_ROLES':
            if (!state) {
                return null;
            }
            return {...state, permittedRoles: action.roles};
        default:
            return state;
    }
};

const combinedReducers = mashroomPortalCommonsCombineReducers<State>({
    user,
    languages,
    sites,
    pages,
    availableApps,
    portalAppControls,
    existingRoles,
    availableThemes,
    availableLayouts,
    selectedPortalApp,
    selectedPage,
    selectedSite
});

export default combinedReducers;
