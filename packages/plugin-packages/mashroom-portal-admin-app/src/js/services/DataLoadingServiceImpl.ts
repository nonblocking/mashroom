
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

    async loadSites(force = false) {
        if (this.siteLinksLoaded && !force) {
            return Promise.resolve();
        }

        this.store.dispatch(setSitesLoading(true));
        try {
            const sites = await this.portalSiteService.getSites();
            this.store.dispatch(setSites(sites));
            this.store.dispatch(setSitesLoading(false));
        } catch (error) {
            console.error('Loading site links failed', error);
            this.store.dispatch(setSitesLoading(false));
            this.store.dispatch(setSitesError(true));
            return Promise.reject(error);
        }
    }

    async loadPageTree(force = false) {
        if (this.pageTreeLoaded && !force) {
            return Promise.resolve();
        }

        this.store.dispatch(setPagesLoading(true));
        try {
            const pageTree = await this.portalSiteService.getPageTree(this.portalAdminService.getCurrentSiteId());
            const flattened = flattenPageTree(pageTree);
            this.store.dispatch(setPages(pageTree));
            this.store.dispatch(setPagesFlattened(flattened));
            this.store.dispatch(setPagesLoading(false));
        } catch (error) {
            console.error('Loading page tree failed', error);
            this.store.dispatch(setPagesLoading(false));
            this.store.dispatch(setPagesError(true));
            return Promise.reject(error);
        }
    }

    async loadAvailableApps(force?: boolean) {
        if (this.availableAppsLoaded && !force) {
            return Promise.resolve();
        }

        this.store.dispatch(setAvailableAppsLoading(true));
        try {
            const availableApps = await this.portalAppService.getAvailableApps();
            console.info('Received available local apps:', availableApps);
            this.store.dispatch(setAvailableAppsLoading(false));
            this.store.dispatch(setAvailableAppsError(false));
            this.store.dispatch(setAvailableApps(availableApps));
        } catch (error) {
            console.error('Loading available local apps failed', error);
            this.store.dispatch(setAvailableAppsLoading(false));
            this.store.dispatch(setAvailableAppsError(true));
            return Promise.reject(error);
        }
    }

    async loadAvailableLanguages(force = false) {
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

        return await Promise.all(promises) as any;
    }

    async loadAvailableThemes(force = false) {
        if (this.availableThemesLoaded && !force) {
            return;
        }

        const themes = await this.portalAdminService.getAvailableThemes();
        store.dispatch(setAvailableThemes(themes));
    }

    async loadAvailableLayouts(force = false) {
        if (this.availableLayoutsLoaded && !force) {
            return;
        }

        const layouts = await this.portalAdminService.getAvailableLayouts();
        store.dispatch(setAvailableLayouts(layouts));
    }

}
