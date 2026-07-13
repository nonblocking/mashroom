
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
    setAvailableAppsLoading,
    setAvailableAppsError,
    setAvailableApps
} from '../store/actions';
import {flattenPageTree} from './model-utils';
import type {Dispatch} from '../store/useStore';

import type {
    MashroomPortalAdminService,
    MashroomPortalUserService,
    MashroomPortalSiteService,
    MashroomPortalAppService
} from '@mashroom/mashroom-portal/type-definitions';
import type {DataLoadingService} from '../types';

export default class DataLoadingServiceImpl implements DataLoadingService {

    portalUserService: MashroomPortalUserService;
    portalSiteService: MashroomPortalSiteService;
    portalAppService: MashroomPortalAppService;
    portalAdminService: MashroomPortalAdminService;
    dispatch: Dispatch;
    siteLinksLoaded: boolean | undefined;
    pageTreeLoaded: boolean | undefined;
    availableAppsLoaded: boolean | undefined;
    availableLanguagesLoaded: boolean | undefined;
    availableThemesLoaded: boolean | undefined;
    availableLayoutsLoaded: boolean | undefined;

    constructor(dispatch: Dispatch, portalUserService: MashroomPortalUserService, portalSiteService: MashroomPortalSiteService, portalAppService: MashroomPortalAppService, portalAdminService: MashroomPortalAdminService) {
        this.dispatch = dispatch;
        this.portalUserService = portalUserService;
        this.portalSiteService = portalSiteService;
        this.portalAppService = portalAppService;
        this.portalAdminService = portalAdminService;
    }

    async loadSites(force = false) {
        if (this.siteLinksLoaded && !force) {
            return Promise.resolve();
        }

        this.dispatch(setSitesLoading(true));
        try {
            const sites = await this.portalSiteService.getSites();
            this.dispatch(setSites(sites));
            this.dispatch(setSitesLoading(false));
        } catch (error) {
            console.error('Loading site links failed', error);
            this.dispatch(setSitesLoading(false));
            this.dispatch(setSitesError(true));
            return Promise.reject(error);
        }
    }

    async loadPageTree(force = false) {
        if (this.pageTreeLoaded && !force) {
            return Promise.resolve();
        }

        this.dispatch(setPagesLoading(true));
        try {
            const pageTree = await this.portalSiteService.getPageTree(this.portalAdminService.getCurrentSiteId());
            const flattened = flattenPageTree(pageTree);
            this.dispatch(setPages(pageTree));
            this.dispatch(setPagesFlattened(flattened));
            this.dispatch(setPagesLoading(false));
        } catch (error) {
            console.error('Loading page tree failed', error);
            this.dispatch(setPagesLoading(false));
            this.dispatch(setPagesError(true));
            return Promise.reject(error);
        }
    }

    async loadAvailableApps(force?: boolean) {
        if (this.availableAppsLoaded && !force) {
            return Promise.resolve();
        }

        this.dispatch(setAvailableAppsLoading(true));
        try {
            const availableApps = await this.portalAppService.getAvailableApps();
            console.info('Received available local apps:', availableApps);
            this.dispatch(setAvailableAppsLoading(false));
            this.dispatch(setAvailableAppsError(false));
            this.dispatch(setAvailableApps(availableApps));
        } catch (error) {
            console.error('Loading available local apps failed', error);
            this.dispatch(setAvailableAppsLoading(false));
            this.dispatch(setAvailableAppsError(true));
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
                this.dispatch(setAvailableLanguages(availableLanguages));
            }
        ));
        promises.push(this.portalUserService.getDefaultLanguage().then(
            (defaultLanguage) => {
                this.dispatch(setDefaultLanguage(defaultLanguage));
            }
        ));

        return await Promise.all(promises) as any;
    }

    async loadAvailableThemes(force = false) {
        if (this.availableThemesLoaded && !force) {
            return;
        }

        const themes = await this.portalAdminService.getAvailableThemes();
        this.dispatch(setAvailableThemes(themes));
    }

    async loadAvailableLayouts(force = false) {
        if (this.availableLayoutsLoaded && !force) {
            return;
        }

        const layouts = await this.portalAdminService.getAvailableLayouts();
        this.dispatch(setAvailableLayouts(layouts));
    }

}
