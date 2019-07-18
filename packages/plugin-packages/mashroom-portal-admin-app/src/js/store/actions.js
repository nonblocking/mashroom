// @flow

import type {
    MashroomAvailablePortalApp, MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalPage,
    MashroomPortalPageRef, MashroomPortalPageRefLocalized,
    MashroomPortalSite,
    MashroomPortalSiteLinkLocalized
} from '@mashroom/mashroom-portal/type-definitions';
import type {FlatPage} from '../../../type-definitions';

export const SET_USER_NAME = 'SET_USER_NAME';
export const SET_SHOW_PORTAL_APP_CONTROLS = 'SET_SHOW_PORTAL_APP_CONTROLS';
export const SET_AVAILABLE_APPS_LOADING = 'SET_AVAILABLE_APPS_LOADING';
export const SET_AVAILABLE_APPS_ERROR = 'SET_AVAILABLE_APPS_ERROR';
export const SET_AVAILABLE_APPS = 'SET_AVAILABLE_APPS';
export const SET_EXISTING_ROLES = 'SET_EXISTING_ROLES';
export const SET_AVAILABLE_THEMES = 'SET_AVAILABLE_THEMES';
export const SET_AVAILABLE_LAYOUTS = 'SET_AVAILABLE_LAYOUTS';
export const SET_CURRENT_LANGAGUE = 'SET_CURRENT_LANGAGUE';
export const SET_DEFAULT_LANGAGUE = 'SET_DEFAULT_LANGAGUE';
export const SET_AVAILABLE_LANGAGUES = 'SET_AVAILABLE_LANGAGUES';

export const SET_SITES = 'SET_SITES';
export const SET_SITES_LOADING = 'SET_SITES_LOADING';
export const SET_SITES_ERROR = 'SET_SITES_ERROR';
export const SET_PAGES = 'SET_PAGES';
export const SET_PAGES_FLATTENED = 'SET_PAGES_FLATTENED';
export const SET_PAGES_LOADING = 'SET_PAGES_LOADING';
export const SET_PAGES_ERROR = 'SET_PAGES_ERROR';

export const SET_SELECTED_PORTAL_APP = 'SET_SELECTED_PORTAL_APP';
export const SET_SELECTED_PORTAL_APP_LOADING = 'SET_SELECTED_PORTAL_APP_LOADING';
export const SET_SELECTED_PORTAL_APP_LOADING_ERROR = 'SET_SELECTED_PORTAL_APP_LOADING_ERROR';
export const SET_SELECTED_PORTAL_APP_UPDATING_ERROR = 'SET_SELECTED_PORTAL_APP_UPDATING_ERROR';
export const SET_SELECTED_PORTAL_APP_PERMITTED_ROLES = 'SET_SELECTED_PORTAL_APP_PERMITTED_ROLES';

export const SET_SELECTED_PAGE = 'SET_SELECTED_PAGE';
export const SET_SELECTED_PAGE_NEW = 'SET_SELECTED_PAGE_NEW';
export const SET_SELECTED_PAGE_LOADING = 'SET_SELECTED_PAGE_LOADING';
export const SET_SELECTED_PAGE_LOADING_ERROR = 'SET_SELECTED_PAGE_LOADING_ERROR';
export const SET_SELECTED_PAGE_UPDATING_ERROR = 'SET_SELECTED_PAGE_UPDATING_ERROR';
export const SET_SELECTED_PAGE_DATA = 'SET_SELECTED_PAGE_DATA';
export const SET_SELECTED_PAGE_REF_DATA = 'SET_SELECTED_PAGE_REF_DATA';
export const SET_SELECTED_PAGE_SITE_DATA = 'SET_SELECTED_PAGE_SITE_DATA';
export const SET_SELECTED_PAGE_PERMITTED_ROLES = 'SET_SELECTED_PAGE_PERMITTED_ROLES';

export const SET_SELECTED_SITE = 'SET_SELECTED_SITE';
export const SET_SELECTED_SITE_NEW = 'SET_SELECTED_SITE_NEW';
export const SET_SELECTED_SITE_LOADING = 'SET_SELECTED_SITE_LOADING';
export const SET_SELECTED_SITE_LOADING_ERROR = 'SET_SELECTED_SITE_LOADING_ERROR';
export const SET_SELECTED_SITE_UPDATING_ERROR = 'SET_SELECTED_SITE_UPDATING_ERROR';
export const SET_SELECTED_SITE_DATA = 'SET_SELECTED_SITE_DATA';
export const SET_SELECTED_SITE_PERMITTED_ROLES = 'SET_SELECTED_SITE_PERMITTED_ROLES';

export const setUserName = (userName: string) => {
    return {
        type: SET_USER_NAME,
        userName,
    };
};

export const setShowPortalAppControls = (show: boolean) => {
    return {
        type: SET_SHOW_PORTAL_APP_CONTROLS,
        show,
    };
};

export const setAvailableAppsLoading = (loading: boolean) => {
    return {
        type: SET_AVAILABLE_APPS_LOADING,
        loading,
    };
};

export const setAvailableAppsError = (error: boolean) => {
    return {
        type: SET_AVAILABLE_APPS_ERROR,
        error,
    };
};

export const setAvailableApps = (apps: Array<MashroomAvailablePortalApp>) => {
    return {
        type: SET_AVAILABLE_APPS,
        apps,
    };
};

export const setSitesLoading = (loading: boolean) => {
    return {
        type: SET_SITES_LOADING,
        loading
    };
};

export const setSitesError = (error: boolean) => {
    return {
        type: SET_SITES_ERROR,
        error
    };
};

export const setSites = (sites: Array<MashroomPortalSiteLinkLocalized>) => {
    return {
        type: SET_SITES,
        sites
    };
};

export const setExistingRoles = (roles: Array<string>) => {
    return {
        type: SET_EXISTING_ROLES,
        roles
    };
};

export const setAvailableThemes = (themes: Array<MashroomAvailablePortalTheme>) => {
    return {
        type: SET_AVAILABLE_THEMES,
        themes
    };
};

export const setAvailableLayouts = (layouts: Array<MashroomAvailablePortalLayout>) => {
    return {
        type: SET_AVAILABLE_LAYOUTS,
        layouts
    };
};

export const setCurrentLanguage = (lang: string) => {
    return {
        type: SET_CURRENT_LANGAGUE,
        lang
    };
};

export const setDefaultLanguage = (lang: string) => {
    return {
        type: SET_DEFAULT_LANGAGUE,
        lang
    };
};

export const setAvailableLanguages = (languages: Array<string>) => {
    return {
        type: SET_AVAILABLE_LANGAGUES,
        languages
    };
};

export const setSelectedPortalApp = (loadedAppId: string, portalAppName: ?string, instanceId: ?string) => {
    return {
        type: SET_SELECTED_PORTAL_APP,
        loadedAppId,
        portalAppName,
        instanceId,
    };
};

export const setSelectedPortalAppLoading = (loading: boolean) => {
    return {
        type: SET_SELECTED_PORTAL_APP_LOADING,
        loading
    };
};

export const setSelectedPortalAppLoadingError = (error: boolean) => {
    return {
        type: SET_SELECTED_PORTAL_APP_LOADING_ERROR,
        error
    };
};

export const setSelectedPortalAppUpdatingError = (error: boolean) => {
    return {
        type: SET_SELECTED_PORTAL_APP_UPDATING_ERROR,
        error
    };
};

export const setSelectedPortalAppPermittedRoles = (roles: ?Array<string>) => {
    return {
        type: SET_SELECTED_PORTAL_APP_PERMITTED_ROLES,
        roles
    };
};

export const setSelectedPage = (pageId: string) => {
    return {
        type: SET_SELECTED_PAGE,
        pageId
    };
};

export const setSelectedPageNew = () => {
    return {
        type: SET_SELECTED_PAGE_NEW
    };
};

export const setSelectedPageLoading = (loading: boolean) => {
    return {
        type: SET_SELECTED_PAGE_LOADING,
        loading
    };
};

export const setSelectedPageLoadingError = (error: boolean) => {
    return {
        type: SET_SELECTED_PAGE_LOADING_ERROR,
        error
    };
};

export const setSelectedPageUpdatingError = (error: boolean) => {
    return {
        type: SET_SELECTED_PAGE_UPDATING_ERROR,
        error
    };
};


export const setSelectedPageData = (page: MashroomPortalPage) => {
    return {
        type: SET_SELECTED_PAGE_DATA,
        page
    };
};

export const setSelectedPageRefData = (pageRef: ?MashroomPortalPageRef) => {
    return {
        type: SET_SELECTED_PAGE_REF_DATA,
        pageRef
    };
};

export const setPagesLoading = (loading: boolean) => {
    return {
        type: SET_PAGES_LOADING,
        loading
    };
};

export const setPagesError = (error: boolean) => {
    return {
        type: SET_PAGES_ERROR,
        error
    };
};

export const setPages = (pages: Array<MashroomPortalPageRefLocalized>) => {
    return {
        type: SET_PAGES,
        pages
    };
};

export const setPagesFlattened = (pages: Array<FlatPage>) => {
    return {
        type: SET_PAGES_FLATTENED,
        pages
    };
};

export const setSelectedPageSiteData = (site: MashroomPortalSite) => {
    return {
        type: SET_SELECTED_PAGE_SITE_DATA,
        site
    };
};

export const setSelectedPagePermittedRoles = (roles: ?Array<string>) => {
    return {
        type: SET_SELECTED_PAGE_PERMITTED_ROLES,
        roles
    };
};

export const setSelectedSite = (siteId: string) => {
    return {
        type: SET_SELECTED_SITE,
        siteId
    };
};

export const setSelectedSiteNew = () => {
    return {
        type: SET_SELECTED_SITE_NEW
    };
};

export const setSelectedSiteLoading = (loading: boolean) => {
    return {
        type: SET_SELECTED_SITE_LOADING,
        loading
    };
};

export const setSelectedSiteLoadingError = (error: boolean) => {
    return {
        type: SET_SELECTED_SITE_LOADING_ERROR,
        error
    };
};

export const setSelectedSiteUpdatingError = (error: boolean) => {
    return {
        type: SET_SELECTED_SITE_UPDATING_ERROR,
        error
    };
};

export const setSelectedSiteData = (site: MashroomPortalSite) => {
    return {
        type: SET_SELECTED_SITE_DATA,
        site
    };
};

export const setSelectedSitePermittedRoles = (roles: ?Array<string>) => {
    return {
        type: SET_SELECTED_SITE_PERMITTED_ROLES,
        roles
    };
};

