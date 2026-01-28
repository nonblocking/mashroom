
import type {
    MashroomAvailablePortalApp, MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalPage,
    MashroomPortalPageRef, MashroomPortalPageRefLocalized,
    MashroomPortalSite,
    MashroomPortalSiteLinkLocalized
} from '@mashroom/mashroom-portal/type-definitions';
import type {FlatPage} from '../types';

export type SetUserNameAction = {
    readonly type: 'SET_USER_NAME';
    readonly userName: string;
}

export type SetShowPortalAppControls = {
    readonly type: 'SET_SHOW_PORTAL_APP_CONTROLS';
    readonly show: boolean;
}

export type SetAvailableAppsLoadingAction = {
    readonly type: 'SET_AVAILABLE_APPS_LOADING';
    readonly loading: boolean;
}

export type SetAvailableAppsErrorAction = {
    readonly type: 'SET_AVAILABLE_APPS_ERROR';
    readonly error: boolean;
}

export type SetAvailableAppsAction = {
    readonly type: 'SET_AVAILABLE_APPS';
    readonly apps: Array<MashroomAvailablePortalApp>;
}

export type SetSitesLoadingAction = {
    readonly type: 'SET_SITES_LOADING';
    readonly loading: boolean;
}

export type SetSitesErrorAction = {
    readonly type: 'SET_SITES_ERROR';
    readonly error: boolean;
}

export type SetSitesAction = {
    readonly type: 'SET_SITES';
    readonly sites: Array<MashroomPortalSiteLinkLocalized>;
}

export type SetExistingRolesAction = {
    readonly type: 'SET_EXISTING_ROLES';
    readonly roles: Array<string>;
}

export type SetAvailableThemesAction = {
    readonly type: 'SET_AVAILABLE_THEMES';
    readonly themes: Array<MashroomAvailablePortalTheme>;
}

export type SetAvailableLayoutsAction = {
    readonly type: 'SET_AVAILABLE_LAYOUTS';
    readonly layouts: Array<MashroomAvailablePortalLayout>;
}

export type SetCurrentLanguageAction = {
    readonly type: 'SET_CURRENT_LANGUAGE';
    readonly lang: string;
}

export type SetDefaultLanguageAction = {
    readonly type: 'SET_DEFAULT_LANGUAGE';
    readonly lang: string;
}

export type SetAvailableLanguagesAction = {
    readonly type: 'SET_AVAILABLE_LANGUAGES';
    readonly languages: Array<string>;
}

export type SetSelectedPortalAppAction = {
    readonly type: 'SET_SELECTED_PORTAL_APP';
    readonly loadedAppId: string;
    readonly portalAppName: string;
    readonly instanceId: string;
    readonly customConfigEditor: boolean;
}

export type SetSelectedPortalAppLoadingAction = {
    readonly type: 'SET_SELECTED_PORTAL_APP_LOADING';
    readonly loading: boolean;
}

export type SetSelectedPortalAppLoadingErrorAction = {
    readonly type: 'SET_SELECTED_PORTAL_APP_LOADING_ERROR';
    readonly error: boolean;
}

export type SetSelectedPortalAppUpdatingErrorAction = {
    readonly type: 'SET_SELECTED_PORTAL_APP_UPDATING_ERROR';
    readonly error: boolean;
}

export type SetSelectedPortalAppPermittedRolesAction = {
    readonly type: 'SET_SELECTED_PORTAL_APP_PERMITTED_ROLES';
    readonly roles: Array<string> | undefined | null;
}

export type SetSelectedPageAction = {
    readonly type: 'SET_SELECTED_PAGE';
    readonly pageId: string;
}

export type SetSelectedPageNewAction = {
    readonly type: 'SET_SELECTED_PAGE_NEW';
}

export type SetSelectdPageLoadingAction = {
    readonly type: 'SET_SELECTED_PAGE_LOADING';
    readonly loading: boolean;
}

export type SetSelectedPageLoadingErrorAction = {
    readonly type: 'SET_SELECTED_PAGE_LOADING_ERROR';
    readonly error: boolean;
}

export type SetSelectedPageUpdatingErrorAction = {
    readonly type: 'SET_SELECTED_PAGE_UPDATING_ERROR';
    readonly error: boolean;
}

export type SetSelectedPageDataAction = {
    readonly type: 'SET_SELECTED_PAGE_DATA';
    readonly page: MashroomPortalPage;
}

export type SetSelectedPageRefDataAction = {
    readonly type: 'SET_SELECTED_PAGE_REF_DATA';
    readonly pageRef: MashroomPortalPageRef | undefined | null;
}

export type SetPagesLoadingAction = {
    readonly type: 'SET_PAGES_LOADING';
    readonly loading: boolean;
}

export type SetPagesErrorAction = {
    readonly type: 'SET_PAGES_ERROR';
    readonly error: boolean;
}

export type SetPagesAction = {
    readonly type: 'SET_PAGES';
    readonly pages: Array<MashroomPortalPageRefLocalized>;
}

export type SetPagesFlattenedAction = {
    readonly type: 'SET_PAGES_FLATTENED';
    readonly pages: Array<FlatPage>;
}

export type SetSelectedPagePermittedRolesAction = {
    readonly type: 'SET_SELECTED_PAGE_PERMITTED_ROLES';
    readonly roles: Array<string> | undefined | null;
}

export type SetSelectedSiteAction = {
    readonly type: 'SET_SELECTED_SITE';
    readonly siteId: string;
}

export type SetSelectedSiteNewAction = {
    readonly type: 'SET_SELECTED_SITE_NEW';
}

export type SetSelectedSiteLoadingAction = {
    readonly type: 'SET_SELECTED_SITE_LOADING';
    readonly loading: boolean;
}

export type SetSelectedSiteLoadingErrorAction = {
    readonly type: 'SET_SELECTED_SITE_LOADING_ERROR';
    readonly error: boolean;
}

export type SetSelectedSiteUpdatingErrorAction = {
    readonly type: 'SET_SELECTED_SITE_UPDATING_ERROR';
    readonly error: boolean;
}

export type SetSelectedSiteDataAction = {
    readonly type: 'SET_SELECTED_SITE_DATA';
    readonly site: MashroomPortalSite;
}

export type SetSelectedSitePermittedRolesAction = {
    readonly type: 'SET_SELECTED_SITE_PERMITTED_ROLES';
    readonly roles: Array<string> | undefined | null;
}

export type ShowModalAction = {
    readonly type: 'SET_SHOW_MODAL';
    readonly dialogName: string;
    readonly show: boolean;
}

export type SetAppWrapperDataAttributesAction = {
    readonly type: 'SET_APP_WRAPPER_DATA_ATTRIBUTES';
    readonly dataAttributes: Record<string, string>;
}

export type SetActiveTabAction = {
    readonly type: 'SET_ACTIVE_TAB';
    readonly dialogName: string;
    readonly active: string;
}

export type AnyAction = SetUserNameAction | SetShowPortalAppControls | SetAvailableAppsLoadingAction | SetAvailableAppsErrorAction
    | SetAvailableAppsAction | SetSitesLoadingAction | SetSitesErrorAction | SetSitesAction | SetExistingRolesAction | SetAvailableThemesAction
    | SetAvailableLayoutsAction | SetCurrentLanguageAction | SetDefaultLanguageAction | SetAvailableLanguagesAction | SetSelectedPortalAppAction
    | SetSelectedPortalAppLoadingAction | SetSelectedPortalAppLoadingErrorAction | SetSelectedPortalAppUpdatingErrorAction
    | SetSelectedPortalAppPermittedRolesAction | SetSelectedPageAction | SetSelectedPageNewAction | SetSelectdPageLoadingAction
    | SetSelectedPageLoadingErrorAction | SetSelectedPageUpdatingErrorAction | SetSelectedPageDataAction | SetSelectedPageRefDataAction
    | SetPagesLoadingAction | SetPagesErrorAction | SetPagesAction | SetPagesFlattenedAction | SetSelectedPagePermittedRolesAction
    | SetSelectedSiteAction | SetSelectedSiteNewAction | SetSelectedSiteLoadingAction | SetSelectedSiteLoadingErrorAction
    | SetSelectedSiteUpdatingErrorAction | SetSelectedSiteDataAction | SetSelectedSitePermittedRolesAction | ShowModalAction
    | SetAppWrapperDataAttributesAction | SetActiveTabAction;

export const setUserName = (userName: string): SetUserNameAction => {
    return {
        type: 'SET_USER_NAME',
        userName,
    };
};

export const setShowPortalAppControls = (show: boolean): SetShowPortalAppControls => {
    return {
        type: 'SET_SHOW_PORTAL_APP_CONTROLS',
        show,
    };
};

export const setAvailableAppsLoading = (loading: boolean): SetAvailableAppsLoadingAction => {
    return {
        type: 'SET_AVAILABLE_APPS_LOADING',
        loading,
    };
};

export const setAvailableAppsError = (error: boolean): SetAvailableAppsErrorAction => {
    return {
        type: 'SET_AVAILABLE_APPS_ERROR',
        error,
    };
};

export const setAvailableApps = (apps: Array<MashroomAvailablePortalApp>): SetAvailableAppsAction => {
    return {
        type: 'SET_AVAILABLE_APPS',
        apps,
    };
};

export const setSitesLoading = (loading: boolean): SetSitesLoadingAction => {
    return {
        type: 'SET_SITES_LOADING',
        loading
    };
};

export const setSitesError = (error: boolean): SetSitesErrorAction => {
    return {
        type: 'SET_SITES_ERROR',
        error
    };
};

export const setSites = (sites: Array<MashroomPortalSiteLinkLocalized>): SetSitesAction => {
    return {
        type: 'SET_SITES',
        sites
    };
};

export const setExistingRoles = (roles: Array<string>): SetExistingRolesAction => {
    return {
        type: 'SET_EXISTING_ROLES',
        roles
    };
};

export const setAvailableThemes = (themes: Array<MashroomAvailablePortalTheme>): SetAvailableThemesAction => {
    return {
        type: 'SET_AVAILABLE_THEMES',
        themes
    };
};

export const setAvailableLayouts = (layouts: Array<MashroomAvailablePortalLayout>): SetAvailableLayoutsAction => {
    return {
        type: 'SET_AVAILABLE_LAYOUTS',
        layouts
    };
};

export const setCurrentLanguage = (lang: string): SetCurrentLanguageAction => {
    return {
        type: 'SET_CURRENT_LANGUAGE',
        lang
    };
};

export const setDefaultLanguage = (lang: string): SetDefaultLanguageAction => {
    return {
        type: 'SET_DEFAULT_LANGUAGE',
        lang
    };
};

export const setAvailableLanguages = (languages: Array<string>): SetAvailableLanguagesAction => {
    return {
        type: 'SET_AVAILABLE_LANGUAGES',
        languages
    };
};

export const setSelectedPortalApp = (loadedAppId: string, portalAppName: string, instanceId: string, customConfigEditor: boolean): SetSelectedPortalAppAction => {
    return {
        type: 'SET_SELECTED_PORTAL_APP',
        loadedAppId,
        portalAppName,
        instanceId,
        customConfigEditor,
    };
};

export const setSelectedPortalAppLoading = (loading: boolean): SetSelectedPortalAppLoadingAction => {
    return {
        type: 'SET_SELECTED_PORTAL_APP_LOADING',
        loading
    };
};

export const setSelectedPortalAppLoadingError = (error: boolean): SetSelectedPortalAppLoadingErrorAction => {
    return {
        type: 'SET_SELECTED_PORTAL_APP_LOADING_ERROR',
        error
    };
};

export const setSelectedPortalAppUpdatingError = (error: boolean): SetSelectedPortalAppUpdatingErrorAction => {
    return {
        type: 'SET_SELECTED_PORTAL_APP_UPDATING_ERROR',
        error
    };
};

export const setSelectedPortalAppPermittedRoles = (roles: Array<string> | undefined | null): SetSelectedPortalAppPermittedRolesAction => {
    return {
        type: 'SET_SELECTED_PORTAL_APP_PERMITTED_ROLES',
        roles
    };
};

export const setSelectedPage = (pageId: string): SetSelectedPageAction => {
    return {
        type: 'SET_SELECTED_PAGE',
        pageId
    };
};

export const setSelectedPageNew = (): SetSelectedPageNewAction => {
    return {
        type: 'SET_SELECTED_PAGE_NEW'
    };
};

export const setSelectedPageLoading = (loading: boolean): SetSelectdPageLoadingAction => {
    return {
        type: 'SET_SELECTED_PAGE_LOADING',
        loading
    };
};

export const setSelectedPageLoadingError = (error: boolean): SetSelectedPageLoadingErrorAction => {
    return {
        type: 'SET_SELECTED_PAGE_LOADING_ERROR',
        error
    };
};

export const setSelectedPageUpdatingError = (error: boolean): SetSelectedPageUpdatingErrorAction  => {
    return {
        type: 'SET_SELECTED_PAGE_UPDATING_ERROR',
        error
    };
};


export const setSelectedPageData = (page: MashroomPortalPage): SetSelectedPageDataAction => {
    return {
        type: 'SET_SELECTED_PAGE_DATA',
        page
    };
};

export const setSelectedPageRefData = (pageRef: MashroomPortalPageRef | undefined | null): SetSelectedPageRefDataAction => {
    return {
        type: 'SET_SELECTED_PAGE_REF_DATA',
        pageRef
    };
};

export const setPagesLoading = (loading: boolean): SetPagesLoadingAction => {
    return {
        type: 'SET_PAGES_LOADING',
        loading
    };
};

export const setPagesError = (error: boolean): SetPagesErrorAction => {
    return {
        type: 'SET_PAGES_ERROR',
        error
    };
};

export const setPages = (pages: Array<MashroomPortalPageRefLocalized>): SetPagesAction => {
    return {
        type: 'SET_PAGES',
        pages
    };
};

export const setPagesFlattened = (pages: Array<FlatPage>): SetPagesFlattenedAction => {
    return {
        type: 'SET_PAGES_FLATTENED',
        pages
    };
};

export const setSelectedPagePermittedRoles = (roles: Array<string> | undefined | null): SetSelectedPagePermittedRolesAction => {
    return {
        type: 'SET_SELECTED_PAGE_PERMITTED_ROLES',
        roles
    };
};

export const setSelectedSite = (siteId: string): SetSelectedSiteAction => {
    return {
        type: 'SET_SELECTED_SITE',
        siteId
    };
};

export const setSelectedSiteNew = (): SetSelectedSiteNewAction => {
    return {
        type: 'SET_SELECTED_SITE_NEW'
    };
};

export const setSelectedSiteLoading = (loading: boolean): SetSelectedSiteLoadingAction => {
    return {
        type: 'SET_SELECTED_SITE_LOADING',
        loading
    };
};

export const setSelectedSiteLoadingError = (error: boolean): SetSelectedSiteLoadingErrorAction => {
    return {
        type: 'SET_SELECTED_SITE_LOADING_ERROR',
        error
    };
};

export const setSelectedSiteUpdatingError = (error: boolean): SetSelectedSiteUpdatingErrorAction => {
    return {
        type: 'SET_SELECTED_SITE_UPDATING_ERROR',
        error
    };
};

export const setSelectedSiteData = (site: MashroomPortalSite): SetSelectedSiteDataAction => {
    return {
        type: 'SET_SELECTED_SITE_DATA',
        site
    };
};

export const setSelectedSitePermittedRoles = (roles: Array<string> | undefined | null): SetSelectedSitePermittedRolesAction => {
    return {
        type: 'SET_SELECTED_SITE_PERMITTED_ROLES',
        roles
    };
};

export const setShowModal = (dialogName: string, show: boolean): ShowModalAction => {
    return {
        type: 'SET_SHOW_MODAL',
        dialogName,
        show,
    };
};

export const setAppWrapperDataAttributes = (dataAttributes: Record<string, string>): SetAppWrapperDataAttributesAction => {
    return {
        type: 'SET_APP_WRAPPER_DATA_ATTRIBUTES',
        dataAttributes,
    };
};

export const setActiveTab = (dialogName: string, active: string): SetActiveTabAction => {
    return {
        type: 'SET_ACTIVE_TAB',
        dialogName,
        active,
    };
};
