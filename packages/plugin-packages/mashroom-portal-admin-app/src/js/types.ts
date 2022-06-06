
import type {Store as ReduxStore, Dispatch as ReduxDispatch, AnyAction} from 'redux';
import type {
    MashroomAvailablePortalApp, MashroomAvailablePortalLayout, MashroomAvailablePortalTheme,
    MashroomPortalAdminService,
    MashroomPortalPage,
    MashroomPortalPageRef, MashroomPortalPageRefLocalized,
    MashroomPortalSite,
    MashroomPortalSiteLinkLocalized,
    MashroomPortalSiteService,
    MashroomPortalUserService
} from '@mashroom/mashroom-portal/type-definitions';

export type Writable<Type> = {
    -readonly [Key in keyof Type]: Type[Key];
}

export type State = {
    readonly user: User;
    readonly languages: Languages;
    readonly existingRoles: Array<string>;
    readonly availableThemes: Array<MashroomAvailablePortalTheme>;
    readonly availableLayouts: Array<MashroomAvailablePortalLayout>;
    readonly sites: Sites;
    readonly pages: Pages;
    readonly availableApps: AvailableApps;
    readonly portalAppControls: boolean;
    readonly selectedPortalApp: SelectedPortalApp | undefined | null;
    readonly selectedPage: SelectedPage | undefined | null;
    readonly selectedSite: SelectedSite | undefined | null;
}

export type Action = AnyAction;

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<State, Action>;

export type Languages = {
    readonly current: string;
    readonly default: string;
    readonly available: Array<string>;
}

export type User = {
    readonly userName: string | undefined | null;
};

export type AvailableApps = {
    readonly loading: boolean;
    readonly error: boolean;
    readonly apps: Array<MashroomAvailablePortalApp> | undefined | null;
};

export type Sites = {
    readonly loading: boolean;
    readonly error: boolean;
    readonly sites: Array<MashroomPortalSiteLinkLocalized>;
}

export type Pages = {
    readonly loading: boolean;
    readonly error: boolean;
    readonly pages: Array<MashroomPortalPageRefLocalized>;
    readonly pagesFlattened: Array<FlatPage>;
}

export type AnyPage = {
    readonly pageId: string;
    readonly title: string;
}

export type SubPage = {
    readonly pageId: string;
    readonly title: string;
}

export type FlatPage = {
    readonly pageId: string;
    readonly title: string;
    readonly friendlyUrl: string;
    readonly clientSideRouting?: boolean;
    readonly level: number;
    readonly subPages?: Array<SubPage>;
}

export type SelectedPortalApp = {
    readonly selectedTs: number;
    readonly loadedAppId: string;
    readonly portalAppName: string;
    readonly instanceId: string;
    readonly permittedRoles: Array<string> | undefined | null;
    readonly customConfigEditor: boolean;
    readonly loading: boolean;
    readonly errorLoading: boolean;
    readonly errorUpdating: boolean;
};

export type SelectedPage = {
    readonly selectedTs: number,
    readonly pageId: string | undefined | null;
    readonly page: MashroomPortalPage | undefined | null;
    readonly pageRef: MashroomPortalPageRef | undefined | null;
    readonly permittedRoles: Array<string> | undefined | null;
    readonly loading: boolean;
    readonly errorLoading: boolean;
    readonly errorUpdating: boolean;
};

export type SelectedSite = {
    readonly selectedTs: number;
    readonly siteId: string | undefined | null;
    readonly site: MashroomPortalSite | undefined | null;
    readonly permittedRoles: Array<string> | undefined | null;
    readonly loading: boolean;
    readonly errorLoading: boolean;
    readonly errorUpdating: boolean;
};

export interface PortalAppManagementService {
    showPortalAppControls(): void;
    hidePortalAppControls(): void;
    prepareDrag(event: DragEvent, loadedAppId: string | undefined | null, portalAppName: string, instanceId?: string| undefined | null): void;
    dragEnd(): void;
    activatePortalAppDropZones(): void;
    deactivatePortalAppDropZones(): void;
    getAppConfigForLoadedApp(portalAppName: string, instanceId: string| undefined | null): any | undefined | null;
    updateAndReloadApp(loadedAppId: string, portalAppName: string, instanceId: string, areaId: string| undefined | null,
                       dynamic: boolean| undefined | null, position: number| undefined | null, appConfig: any| undefined | null): Promise<void>;
}

export interface DataLoadingService {
    loadSites(force?: boolean): Promise<void>;
    loadPageTree(force?: boolean): Promise<void>;
    loadAvailableApps(force?: boolean): Promise<void>;
    loadAvailableLanguages(force?: boolean): Promise<void>;
    loadAvailableThemes(force?: boolean): Promise<void>;
    loadAvailableLayouts(force?: boolean): Promise<void>;
}

export type DependencyContext = {
    readonly portalAppManagementService: PortalAppManagementService;
    readonly portalSiteService: MashroomPortalSiteService;
    readonly portalUserService: MashroomPortalUserService;
    readonly portalAdminService: MashroomPortalAdminService;
    readonly dataLoadingService: DataLoadingService;
}

export type PagePosition = {
    parentPageId: string | undefined | null;
    insertAfterPageId: string | undefined | null;
}
