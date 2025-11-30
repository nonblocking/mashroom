

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
    User, ModalState, TabDialogState
} from '../types';
import type {
    SetActiveTabAction,
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
    SetUserNameAction, ShowModalAction
} from './actions';

const user = (state: User, action: SetUserNameAction) => {
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

const languages = (state: Languages, action: SetCurrentLanguageAction | SetDefaultLanguageAction | SetAvailableLanguagesAction) => {
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

const existingRoles = (state: Array<string>, action: SetExistingRolesAction) => {
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

const availableThemes = (state: Array<MashroomAvailablePortalTheme>, action: SetAvailableThemesAction) => {
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

const availableLayouts = (state: Array<MashroomAvailablePortalLayout>, action: SetAvailableLayoutsAction) => {
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

const sites = (state: Sites, action: SetSitesAction | SetSitesLoadingAction | SetSitesErrorAction) => {
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

const pages = (state: Pages, action: SetPagesAction | SetPagesFlattenedAction | SetPagesLoadingAction | SetPagesErrorAction) => {
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

const portalAppControls = (state: boolean, action: SetShowPortalAppControls) => {
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

const availableApps = (state: AvailableApps, action: SetAvailableAppsLoadingAction | SetAvailableAppsErrorAction | SetAvailableAppsAction) => {
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

const selectedPortalApp = (state: SelectedPortalApp | undefined | null, action: SetSelectedPortalAppAction | SetSelectedPortalAppLoadingAction | SetSelectedPortalAppLoadingErrorAction | SetSelectedPortalAppUpdatingErrorAction | SetSelectedPortalAppPermittedRolesAction) => {
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

const selectedPage = (state: SelectedPage | undefined | null, action: SetSelectedPageAction | SetSelectedPageNewAction | SetSelectdPageLoadingAction
    | SetSelectedPageLoadingErrorAction | SetSelectedPageUpdatingErrorAction
    | SetSelectedPageRefDataAction | SetSelectedPageDataAction | SetSelectedPagePermittedRolesAction) => {
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

const selectedSite = (state: SelectedSite | undefined | null, action: SetSelectedSiteAction | SetSelectedSiteNewAction | SetSelectedSiteLoadingAction
    | SetSelectedSiteLoadingErrorAction | SetSelectedSiteUpdatingErrorAction | SetSelectedSiteDataAction | SetSelectedSitePermittedRolesAction) => {
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

const modals = (state: ModalState, action: ShowModalAction) => {
    if (typeof (state) === 'undefined') {
        return {};
    }

    switch (action.type) {
    case 'SET_SHOW_MODAL': {
        return {
            ...state,
            [action.dialogName]: {
                show: action.show,
            },
        };
    }
    default:
        return state;
    }
};

const tabDialogs = (state: TabDialogState, action: SetActiveTabAction) => {
    if (typeof (state) === 'undefined') {
        return {};
    }

    switch (action.type) {
    case 'SET_ACTIVE_TAB': {
        return {
            ...state,
            [action.dialogName]: {
                active: action.active,
            },
        };
    }
    default:
        return state;
    }
};

export default (state: State, action: any): State => {
    return {
        user: user(state.user, action),
        languages: languages(state.languages, action),
        sites: sites(state.sites, action),
        pages: pages(state.pages, action),
        availableApps: availableApps(state.availableApps, action),
        portalAppControls: portalAppControls(state.portalAppControls, action),
        existingRoles: existingRoles(state.existingRoles, action),
        availableThemes: availableThemes(state.availableThemes, action),
        availableLayouts: availableLayouts(state.availableLayouts, action),
        selectedPortalApp: selectedPortalApp(state.selectedPortalApp, action),
        selectedPage: selectedPage(state.selectedPage, action),
        selectedSite: selectedSite(state.selectedSite, action),
        modals: modals(state.modals, action),
        tabDialogs: tabDialogs(state.tabDialogs, action),
    };
};

