// @flow

import {mashroomPortalCommonsCombineReducers} from '@mashroom/mashroom-portal-ui-commons';

import type {
    AvailableApps,
    Languages,
    SelectedPage,
    SelectedPortalApp,
    SelectedSite,
    User,
    Pages,
    Sites
} from '../../../type-definitions';

import {
    SET_USER_NAME,
    SET_SHOW_PORTAL_APP_CONTROLS,
    SET_AVAILABLE_APPS,
    SET_AVAILABLE_APPS_LOADING,
    SET_AVAILABLE_APPS_ERROR,
    SET_SITES,
    SET_SITES_LOADING,
    SET_SITES_ERROR,
    SET_PAGES,
    SET_PAGES_FLATTENED,
    SET_PAGES_LOADING,
    SET_PAGES_ERROR,
    SET_EXISTING_ROLES,
    SET_CURRENT_LANGAGUE,
    SET_DEFAULT_LANGAGUE,
    SET_AVAILABLE_LANGAGUES,
    SET_SELECTED_PORTAL_APP,
    SET_SELECTED_PORTAL_APP_LOADING,
    SET_SELECTED_PORTAL_APP_LOADING_ERROR,
    SET_SELECTED_PORTAL_APP_UPDATING_ERROR,
    SET_SELECTED_PORTAL_APP_PERMITTED_ROLES,
    SET_SELECTED_PAGE,
    SET_SELECTED_PAGE_NEW,
    SET_SELECTED_PAGE_LOADING,
    SET_SELECTED_PAGE_LOADING_ERROR,
    SET_SELECTED_PAGE_UPDATING_ERROR,
    SET_SELECTED_PAGE_DATA,
    SET_SELECTED_PAGE_SITE_DATA,
    SET_SELECTED_PAGE_PERMITTED_ROLES,
    SET_SELECTED_PAGE_REF_DATA,
    SET_SELECTED_SITE,
    SET_SELECTED_SITE_NEW,
    SET_SELECTED_SITE_LOADING,
    SET_SELECTED_SITE_LOADING_ERROR,
    SET_SELECTED_SITE_UPDATING_ERROR,
    SET_SELECTED_SITE_DATA,
    SET_SELECTED_SITE_PERMITTED_ROLES,
    SET_AVAILABLE_THEMES, SET_AVAILABLE_LAYOUTS
} from './actions';

import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme
} from '@mashroom/mashroom-portal/type-definitions';
import type {Action} from '../../../type-definitions';

const user = (state: User, action: Action): User => {
    if (typeof(state) === 'undefined') {
        return {
            userName: null,
        };
    }

    switch (action.type) {
        case SET_USER_NAME: {
            return Object.assign({}, state, {
               userName: action.userName,
            });
        }
        default:
            return state;
    }
};

const languages = (state: Languages, action: Action): Languages => {
    if (typeof(state) === 'undefined') {
        return {
            current: 'en',
            default: 'en',
            available: []
        };
    }

    switch (action.type) {
        case SET_CURRENT_LANGAGUE:
            return Object.assign({}, state, {
                current: action.lang
            });
        case SET_DEFAULT_LANGAGUE:
            return Object.assign({}, state, {
                default: action.lang
            });
        case SET_AVAILABLE_LANGAGUES:
            return Object.assign({}, state, {
                available: action.languages
            });
        default:
            return state;
    }
};

const existingRoles = (state: Array<string>, action: Action): Array<string> => {
    if (typeof(state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case SET_EXISTING_ROLES:
            return action.roles;
        default:
            return state;
    }
};

const availableThemes = (state: Array<MashroomAvailablePortalTheme>, action: Action): Array<MashroomAvailablePortalTheme> => {
    if (typeof(state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case SET_AVAILABLE_THEMES:
            return action.themes;
        default:
            return state;
    }
};

const availableLayouts = (state: Array<MashroomAvailablePortalLayout>, action: Action): Array<MashroomAvailablePortalLayout> => {
    if (typeof(state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case SET_AVAILABLE_LAYOUTS:
            return action.layouts;
        default:
            return state;
    }
};

const sites = (state: Sites, action: Action): Sites => {
    if (typeof(state) === 'undefined') {
        return {
            loading: false,
            error: false,
            sites: []
        };
    }

    switch (action.type) {
        case SET_SITES:
            return Object.assign({}, state, {
                sites: action.sites
            });
        case SET_SITES_LOADING:
            return Object.assign({}, state, {
                loading: action.loading
            });
        case SET_SITES_ERROR:
            return Object.assign({}, state, {
                error: action.error
            });
        default:
            return state;
    }
};

const pages = (state: Pages, action: Action): Pages => {
    if (typeof(state) === 'undefined') {
        return {
            loading: false,
            error: false,
            pages: [],
            pagesFlattened: []
        }
    }

    switch (action.type) {
        case SET_PAGES:
            return Object.assign({}, state, {
                pages: action.pages
            });
        case SET_PAGES_FLATTENED:
            return Object.assign({}, state, {
                pagesFlattened: action.pages
            });
        case SET_PAGES_LOADING:
            return Object.assign({}, state, {
                loading: action.loading
            });
        case SET_PAGES_ERROR:
            return Object.assign({}, state, {
                error: action.error
            });
        default:
            return state;
    }
};

const portalAppControls = (state: boolean, action: Action): boolean => {
    if (typeof(state) === 'undefined') {
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

const availableApps = (state: AvailableApps, action: Action): AvailableApps => {
    if (typeof(state) === 'undefined') {
        return {
            loading: false,
            error: false,
            apps: null
        };
    }

    switch (action.type) {
        case SET_AVAILABLE_APPS_LOADING: {
            return Object.assign({}, state, {
                loading: action.loading,
            });
        }
        case SET_AVAILABLE_APPS_ERROR: {
            return Object.assign({}, state, {
                error: action.error,
            });
        }
        case SET_AVAILABLE_APPS: {
            return Object.assign({}, state, {
                apps: action.apps,
            });
        }
        default:
            return state;
    }
};

const selectedPortalApp = (state: ?SelectedPortalApp, action: Action): ?SelectedPortalApp => {
    if (typeof(state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case SET_SELECTED_PORTAL_APP: {
            return Object.assign({}, state, {
                selectedTs: Date.now(),
                loadedAppId: action.loadedAppId,
                portalAppName: action.portalAppName,
                instanceId: action.instanceId,
                loading: true,
                errorLoading: false,
                errorUpdating: false,
                permittedRoles: null
            });
        }
        case SET_SELECTED_PORTAL_APP_LOADING:
            return Object.assign({}, state, {
                loading: action.loading,
            });
        case SET_SELECTED_PORTAL_APP_LOADING_ERROR:
            return Object.assign({}, state, {
                loading: false,
                errorLoading: action.error
            });
        case SET_SELECTED_PORTAL_APP_UPDATING_ERROR: {
            return Object.assign({}, state, {
                errorUpdating: action.error
            });
        }
        case SET_SELECTED_PORTAL_APP_PERMITTED_ROLES:
            return Object.assign({}, state, {
                permittedRoles: action.roles,
            });
        default:
            return state;
    }
};

const selectedPage = (state: ?SelectedPage, action: Action): ?SelectedPage => {
    if (typeof(state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case SET_SELECTED_PAGE: {
            return Object.assign({}, state, {
                selectedTs: Date.now(),
                pageId: action.pageId,
                loading: true,
                errorLoading: false,
                errorUpdating: false,
                page: null,
                pageRef: null,
                permittedRoles: null
            });
        }
        case SET_SELECTED_PAGE_NEW: {
            return Object.assign({}, state, {
                selectedTs: Date.now(),
                pageId: null,
                loading: false,
                errorLoading: false,
                errorUpdating: false,
                page: null,
                pageRef: null,
                permittedRoles: null
            });
        }
        case SET_SELECTED_PAGE_LOADING:
            return Object.assign({}, state, {
                loading: action.loading,
                errorLoading: false
            });
        case SET_SELECTED_PAGE_LOADING_ERROR:
            return Object.assign({}, state, {
                loading: false,
                errorLoading: action.error
            });
        case SET_SELECTED_PAGE_UPDATING_ERROR: {
            return Object.assign({}, state, {
                errorUpdating: action.error
            });
        }
        case SET_SELECTED_PAGE_DATA:
            return Object.assign({}, state, {
                page: action.page,
            });
        case SET_SELECTED_PAGE_REF_DATA:
            return Object.assign({}, state, {
                pageRef: action.pageRef,
            });
        case SET_SELECTED_PAGE_SITE_DATA:
            return Object.assign({}, state, {
                site: action.site,
            });
        case SET_SELECTED_PAGE_PERMITTED_ROLES:
            return Object.assign({}, state, {
                permittedRoles: action.roles,
            });
        default:
            return state;
    }
};

const selectedSite = (state: ?SelectedSite, action: Action): ?SelectedSite => {
    if (typeof(state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case SET_SELECTED_SITE: {
            return Object.assign({}, state, {
                selectedTs: Date.now(),
                siteId: action.siteId,
                loading: true,
                errorLoading: false,
                errorUpdating: false,
                site: null,
                permittedRoles: null
            });
        }
        case SET_SELECTED_SITE_NEW: {
            return Object.assign({}, state, {
                selectedTs: Date.now(),
                siteId: null,
                loading: false,
                errorLoading: false,
                errorUpdating: false,
                site: null,
                permittedRoles: null
            });
        }
        case SET_SELECTED_SITE_LOADING:
            return Object.assign({}, state, {
                loading: action.loading,
            });
        case SET_SELECTED_SITE_LOADING_ERROR:
            return Object.assign({}, state, {
                loading: false,
                errorLoading: action.error
            });
        case SET_SELECTED_SITE_UPDATING_ERROR: {
            return Object.assign({}, state, {
                errorUpdating: action.error
            });
        }
        case SET_SELECTED_SITE_DATA:
            return Object.assign({}, state, {
                site: action.site,
            });
        case SET_SELECTED_SITE_PERMITTED_ROLES:
            return Object.assign({}, state, {
                permittedRoles: action.roles,
            });
        default:
            return state;
    }
};

const combinedReducers = mashroomPortalCommonsCombineReducers({
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
