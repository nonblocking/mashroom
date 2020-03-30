// @flow

import type {Store as ReduxStore, Dispatch as ReduxDispatch} from 'redux';
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

export type State = {|
    +user: User,
    +languages: Languages,
    +existingRoles: Array<string>,
    +availableThemes: Array<MashroomAvailablePortalTheme>,
    +availableLayouts: Array<MashroomAvailablePortalLayout>,
    +sites: Sites,
    +pages: Pages,
    +availableApps: AvailableApps,
    +portalAppControls: boolean,
    +selectedPortalApp: ?SelectedPortalApp,
    +selectedPage: ?SelectedPage,
    +selectedSite: ?SelectedSite
|}

export type Action = { type: string } & { [any]: any };

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<$Subtype<State>, Action>;

export type Languages = {
    +current: string,
    +default: string,
    +available: Array<string>
}

export type User = {
    +userName: ?string
};

export type AvailableApps = {
    +loading: boolean,
    +error: boolean,
    +apps: ?Array<MashroomAvailablePortalApp>,
};

export type Sites = {
    +loading: boolean,
    +error: boolean,
    +sites: Array<MashroomPortalSiteLinkLocalized>
}

export type Pages = {
    +loading: boolean,
    +error: boolean,
    +pages: Array<MashroomPortalPageRefLocalized>,
    +pagesFlattened: Array<FlatPage>,
}

export type AnyPage = $Subtype<{
    +pageId: string,
    +title: string
}>

export type SubPage = {
    +pageId: string,
    +title: string
}

export type FlatPage = {
    +pageId: string,
    +title: string,
    +friendlyUrl: string,
    +level: number,
    +subPages?: Array<SubPage>
}

export type SelectedPortalApp = {
    +selectedTs: number,
    +loadedAppId: string,
    +portalAppName: string,
    +instanceId: string,
    +permittedRoles: ?Array<string>,
    +loading: boolean,
    +errorLoading: boolean,
    +errorUpdating: boolean
};

export type SelectedPage = {
    +selectedTs: number,
    +pageId: ?string,
    +page: ?MashroomPortalPage,
    +pageRef: ?MashroomPortalPageRef,
    +site: MashroomPortalSite,
    +permittedRoles: ?Array<string>,
    +loading: boolean,
    +errorLoading: boolean,
    +errorUpdating: boolean
};

export type SelectedSite = {
    +selectedTs: number,
    +siteId: ?string,
    +site: ?MashroomPortalSite,
    +permittedRoles: ?Array<string>,
    +loading: boolean,
    +errorLoading: boolean,
    +errorUpdating: boolean
};

export interface PortalAppManagementService {
    showPortalAppControls(): void;
    hidePortalAppControls(): void;
    prepareDrag(event: DragEvent, loadedAppId: ?string, portalAppName: string, instanceId: ?string): void;
    dragEnd(): void;
    activatePortalAppDropZones(): void;
    deactivatePortalAppDropZones(): void;
    getAppConfigForLoadedApp(portalAppName: string, instanceId: ?string): ?any;
    updateAndReloadApp(loadedAppId: string, portalAppName: string, instanceId: string, areaId: ?string, dynamic: ?boolean, position: ?number, appConfig: ?any): Promise<void>;
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
    +portalAppManagementService: PortalAppManagementService,
    +portalSiteService: MashroomPortalSiteService,
    +portalUserService: MashroomPortalUserService,
    +portalAdminService: MashroomPortalAdminService,
    +dataLoadingService: DataLoadingService
}
