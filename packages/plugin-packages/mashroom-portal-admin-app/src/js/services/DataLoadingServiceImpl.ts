
import {
    setAvailableLanguages,
    setDefaultLanguage,
    setSites,
    setSitesLoading,
    setSitesError,
    setPages,
    setPagesFlattened,
    setPagesError,
    setPagesLoading,
    setAvailableThemes,
    setAvailableLayouts,
    setAvailableAppsLoading, setAvailableAppsError, setAvailableApps
} from '../store/actions';
import store from '../store/store';
import {flattenPageTree} from './model-utils';

import type {
    MashroomPortalAdminService,
    MashroomPortalUserService,
    MashroomPortalSiteService,
    MashroomPortalAppService
} from '@mashroom/mashroom-portal/type-definitions';
import type {Store, DataLoadingService} from '../types';

export default class DataLoadingServiceImpl implements DataLoadingService {

    portalUserService: MashroomPortalUserService;
    portalSiteService: MashroomPortalSiteService;
    portalAppService: MashroomPortalAppService;
    portalAdminService: MashroomPortalAdminService;
    store: Store;

    siteLinksLoaded: boolean | undefined;
    pageTreeLoaded: boolean | undefined;
    availableAppsLoaded: boolean | undefined;
    availableLanguagesLoaded: boolean | undefined;
    availableThemesLoaded: boolean | undefined;
    availableLayoutsLoaded: boolean | undefined;

    constructor(store: Store, portalUserService: MashroomPortalUserService, portalSiteService: MashroomPortalSiteService, portalAppService: MashroomPortalAppService, portalAdminService: MashroomPortalAdminService) {
        this.store = store;
        this.portalUserService = portalUserService;
        this.portalSiteService = portalSiteService;
        this.portalAppService = portalAppService;
        this.portalAdminService = portalAdminService;
    }

    loadSites(force = false) {
        if (this.siteLinksLoaded && !force) {
            return Promise.resolve();
        }

        this.store.dispatch(setSitesLoading(true));
        return this.portalSiteService.getSites().then(
            (sites) => {
                this.store.dispatch(setSites(sites));
                this.store.dispatch(setSitesLoading(false));
            },
            (error) => {
                console.error('Loading site links failed', error);
                this.store.dispatch(setSitesLoading(false));
                this.store.dispatch(setSitesError(true));
                return Promise.reject(error);
            }
        );
    }

    loadPageTree(force = false) {
        if (this.pageTreeLoaded && !force) {
            return Promise.resolve();
        }

        this.store.dispatch(setPagesLoading(true));
        return this.portalSiteService.getPageTree(this.portalAdminService.getCurrentSiteId()).then(
            (pageTree) => {
                const flattened = flattenPageTree(pageTree);
                this.store.dispatch(setPages(pageTree));
                this.store.dispatch(setPagesFlattened(flattened));
                this.store.dispatch(setPagesLoading(false));
            },
            (error) => {
                console.error('Loading page tree failed', error);
                this.store.dispatch(setPagesLoading(false));
                this.store.dispatch(setPagesError(true));
                return Promise.reject(error);
            }
        );
    }

    loadAvailableApps(force?: boolean) {
        if (this.availableAppsLoaded && !force) {
            return Promise.resolve();
        }

        this.store.dispatch(setAvailableAppsLoading(true));
        return this.portalAppService.getAvailableApps().then(
            (availableApps) => {
                console.info('Received available local apps:', availableApps);
                this.store.dispatch(setAvailableAppsLoading(false));
                this.store.dispatch(setAvailableAppsError(false));
                this.store.dispatch(setAvailableApps(availableApps));
            },
            (error) => {
                console.error('Loading available local apps failed', error);
                this.store.dispatch(setAvailableAppsLoading(false));
                this.store.dispatch(setAvailableAppsError(true));
                return Promise.reject(error);
            }
        );
    }

    loadAvailableLanguages(force = false) {
        if (this.availableLanguagesLoaded && !force) {
            return Promise.resolve();
        }

        const promises = [];
        promises.push(this.portalUserService.getAvailableLanguages().then(
            (availableLanguages) => {
                store.dispatch(setAvailableLanguages(availableLanguages));
            }
        ));
        promises.push(this.portalUserService.getDefaultLanguage().then(
            (defaultLanguage) => {
                store.dispatch(setDefaultLanguage(defaultLanguage));
            }
        ));

        return Promise.all(promises) as any;
    }

    loadAvailableThemes(force = false) {
        if (this.availableThemesLoaded && !force) {
            return Promise.resolve();
        }

        return this.portalAdminService.getAvailableThemes().then(
            (themes) => {
                store.dispatch(setAvailableThemes(themes));
            }
        );
    }

    loadAvailableLayouts(force = false) {
        if (this.availableLayoutsLoaded && !force) {
            return Promise.resolve();
        }

        return this.portalAdminService.getAvailableLayouts().then(
            (layouts) => {
                store.dispatch(setAvailableLayouts(layouts));
            }
        );
    }

}
