
import {mashroomPortalCommonsCombineReducers} from '@mashroom/mashroom-portal-ui-commons';
import {
    SET_AVAILABLE_APPS,
    SET_AVAILABLE_APPS_ERROR,
    SET_AVAILABLE_APPS_LOADING,
    SET_AVAILABLE_LANGAGUES,
    SET_AVAILABLE_LAYOUTS,
    SET_AVAILABLE_THEMES,
    SET_CURRENT_LANGAGUE,
    SET_DEFAULT_LANGAGUE,
    SET_EXISTING_ROLES,
    SET_PAGES,
    SET_PAGES_ERROR,
    SET_PAGES_FLATTENED,
    SET_PAGES_LOADING,
    SET_SELECTED_PAGE,
    SET_SELECTED_PAGE_DATA,
    SET_SELECTED_PAGE_LOADING,
    SET_SELECTED_PAGE_LOADING_ERROR,
    SET_SELECTED_PAGE_NEW,
    SET_SELECTED_PAGE_PERMITTED_ROLES,
    SET_SELECTED_PAGE_REF_DATA,
    SET_SELECTED_PAGE_SITE_DATA,
    SET_SELECTED_PAGE_UPDATING_ERROR,
    SET_SELECTED_PORTAL_APP,
    SET_SELECTED_PORTAL_APP_LOADING,
    SET_SELECTED_PORTAL_APP_LOADING_ERROR,
    SET_SELECTED_PORTAL_APP_PERMITTED_ROLES,
    SET_SELECTED_PORTAL_APP_UPDATING_ERROR,
    SET_SELECTED_SITE,
    SET_SELECTED_SITE_DATA,
    SET_SELECTED_SITE_LOADING,
    SET_SELECTED_SITE_LOADING_ERROR,
    SET_SELECTED_SITE_NEW,
    SET_SELECTED_SITE_PERMITTED_ROLES,
    SET_SELECTED_SITE_UPDATING_ERROR,
    SET_SHOW_PORTAL_APP_CONTROLS,
    SET_SITES,
    SET_SITES_ERROR,
    SET_SITES_LOADING,
    SET_USER_NAME
} from './actions';

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

const user: Reducer<User> = (state, action) => {
    if (!state) {
        return {
            userName: null,
        };
    }

    switch (action.type) {
        case SET_USER_NAME: {
            return {...state, userName: action.userName};
        }
        default:
            return state;
    }
};

const languages: Reducer<Languages> = (state, action) => {
    if (!state) {
        return {
            current: 'en',
            default: 'en',
            available: []
        };
    }

    switch (action.type) {
        case SET_CURRENT_LANGAGUE:
            return {...state, current: action.lang};
        case SET_DEFAULT_LANGAGUE:
            return {...state, default: action.lang};
        case SET_AVAILABLE_LANGAGUES:
            return {...state, available: action.languages};
        default:
            return state;
    }
};

const existingRoles: Reducer<Array<string>> = (state, action) => {
    if (!state) {
        return [];
    }

    switch (action.type) {
        case SET_EXISTING_ROLES:
            return action.roles;
        default:
            return state;
    }
};

const availableThemes: Reducer<Array<MashroomAvailablePortalTheme>> = (state, action) => {
    if (!state) {
        return [];
    }

    switch (action.type) {
        case SET_AVAILABLE_THEMES:
            return action.themes;
        default:
            return state;
    }
};

const availableLayouts: Reducer<Array<MashroomAvailablePortalLayout>> = (state, action) => {
    if (!state) {
        return [];
    }

    switch (action.type) {
        case SET_AVAILABLE_LAYOUTS:
            return action.layouts;
        default:
            return state;
    }
};

const sites: Reducer<Sites> = (state, action) => {
    if (!state) {
        return {
            loading: false,
            error: false,
            sites: []
        };
    }

    switch (action.type) {
        case SET_SITES:
            return {...state, sites: action.sites};
        case SET_SITES_LOADING:
            return {...state, loading: action.loading};
        case SET_SITES_ERROR:
            return {...state, error: action.error};
        default:
            return state;
    }
};

const pages: Reducer<Pages> = (state, action) => {
    if (!state) {
        return {
            loading: false,
            error: false,
            pages: [],
            pagesFlattened: []
        };
    }

    switch (action.type) {
        case SET_PAGES:
            return {...state, pages: action.pages};
        case SET_PAGES_FLATTENED:
            return {...state, pagesFlattened: action.pages};
        case SET_PAGES_LOADING:
            return {...state, loading: action.loading};
        case SET_PAGES_ERROR:
            return {...state, error: action.error};
        default:
            return state;
    }
};

const portalAppControls: Reducer<boolean> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return true;
    }

    switch (action.type) {
        case SET_SHOW_PORTAL_APP_CONTROLS: {
            return action.show;
        }
        default:
            return state;
    }
};

const availableApps: Reducer<AvailableApps> = (state, action) => {
    if (!state) {
        return {
            loading: false,
            error: false,
            apps: null
        };
    }

    switch (action.type) {
        case SET_AVAILABLE_APPS_LOADING: {
            return {...state, loading: action.loading};
        }
        case SET_AVAILABLE_APPS_ERROR: {
            return {...state, error: action.error};
        }
        case SET_AVAILABLE_APPS: {
            return {...state, apps: action.apps};
        }
        default:
            return state;
    }
};

const selectedPortalApp: Reducer<SelectedPortalApp | undefined | null> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case SET_SELECTED_PORTAL_APP: {
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
        case SET_SELECTED_PORTAL_APP_LOADING:
            if (!state) {
                return null;
            }
            return {...state, loading: action.loading};
        case SET_SELECTED_PORTAL_APP_LOADING_ERROR:
            if (!state) {
                return null;
            }
            return {
                ...state,
                loading: false,
                errorLoading: action.error
            };
        case SET_SELECTED_PORTAL_APP_UPDATING_ERROR: {
            if (!state) {
                return null;
            }
            return {...state, errorUpdating: action.error};
        }
        case SET_SELECTED_PORTAL_APP_PERMITTED_ROLES:
            if (!state) {
                return null;
            }
            return {...state, permittedRoles: action.roles};
        default:
            return state;
    }
};

const selectedPage: Reducer<SelectedPage | undefined | null> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case SET_SELECTED_PAGE: {
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
        case SET_SELECTED_PAGE_NEW: {
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
        case SET_SELECTED_PAGE_LOADING:
            if (!state) {
                return null;
            }
            return {
                ...state,
                loading: action.loading,
                errorLoading: false
            };
        case SET_SELECTED_PAGE_LOADING_ERROR:
            if (!state) {
                return null;
            }
            return {
                ...state,
                loading: false,
                errorLoading: action.error
            };
        case SET_SELECTED_PAGE_UPDATING_ERROR: {
            if (!state) {
                return null;
            }
            return {...state, errorUpdating: action.error};
        }
        case SET_SELECTED_PAGE_DATA:
            if (!state) {
                return null;
            }
            return {...state, page: action.page};
        case SET_SELECTED_PAGE_REF_DATA:
            if (!state) {
                return null;
            }
            return {...state, pageRef: action.pageRef};
        case SET_SELECTED_PAGE_SITE_DATA:
            if (!state) {
                return null;
            }
            return {...state, site: action.site};
        case SET_SELECTED_PAGE_PERMITTED_ROLES:
            if (!state) {
                return null;
            }
            return {...state, permittedRoles: action.roles};
        default:
            return state;
    }
};

const selectedSite: Reducer<SelectedSite | undefined | null> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case SET_SELECTED_SITE: {
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
        case SET_SELECTED_SITE_NEW: {
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
        case SET_SELECTED_SITE_LOADING:
            if (!state) {
                return null;
            }
            return {...state, loading: action.loading};
        case SET_SELECTED_SITE_LOADING_ERROR:
            if (!state) {
                return null;
            }
            return {
                ...state,
                loading: false,
                errorLoading: action.error
            };
        case SET_SELECTED_SITE_UPDATING_ERROR: {
            if (!state) {
                return null;
            }
            return {...state, errorUpdating: action.error};
        }
        case SET_SELECTED_SITE_DATA:
            if (!state) {
                return null;
            }
            return {...state, site: action.site};
        case SET_SELECTED_SITE_PERMITTED_ROLES:
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
