
import {WINDOW_VAR_PORTAL_API_PATH, WINDOW_VAR_PORTAL_PAGE_ID, WINDOW_VAR_PORTAL_SITE_ID} from '../../../backend/constants';

import type {MashroomPluginConfig} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalAdminService,
    MashroomRestService,
    MashroomCreatePagePortalAppInstance,
    MashroomUpdatePagePortalAppInstance,
    MashroomPortalPage,
    MashroomPortalSite
} from '../../../../type-definitions';

export default class MashroomPortalAppServiceImpl implements MashroomPortalAdminService {

    private restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this.restService = restService.withBasePath(apiPath);
    }

    getAvailableThemes() {
        const path = `/themes`;
        return this.restService.get(path);
    }

    getAvailableLayouts() {
        const path = `/layouts`;
        return this.restService.get(path);
    }

    getExistingRoles() {
        const path = `/roles`;
        return this.restService.get(path);
    }

    getAppInstances() {
        const pageId = this.getCurrentPageId();
        const path = `/pages/${pageId}/portal-app-instances`;
        return this.restService.get(path);
    }

    addAppInstance(pluginName: string, areaId: string, position?: number, appConfig?: MashroomPluginConfig) {
        const pageId = this.getCurrentPageId();
        const data: MashroomCreatePagePortalAppInstance = {
            pluginName,
            areaId,
            position,
            appConfig,
        };

        const path = `/pages/${pageId}/portal-app-instances`;
        return this.restService.post(path, data);
    }

    updateAppInstance(pluginName: string, instanceId: string, areaId: string | undefined | null, position: number | undefined | null,
                      appConfig: MashroomPluginConfig | undefined | null) {
        const pageId = this.getCurrentPageId();
        const data: MashroomUpdatePagePortalAppInstance = {};
        if (areaId) {
            data.areaId = areaId;
        }
        if (typeof(position) === 'number') {
            data.position = position;
        }
        if (appConfig) {
            data.appConfig = appConfig;
        }

        const path = `/pages/${pageId}/portal-app-instances/${pluginName}/${instanceId}`;
        return this.restService.put(path, data);
    }

    removeAppInstance(pluginName: string, instanceId: string) {
        const pageId = this.getCurrentPageId();
        const path = `/pages/${pageId}/portal-app-instances/${pluginName}/${instanceId}`;
        return this.restService.delete(path);
    }

    getAppInstancePermittedRoles(pluginName: string, instanceId: string) {
        const pageId = this.getCurrentPageId();
        const path = `/pages/${pageId}/portal-app-instances/${pluginName}/${instanceId}/permittedRoles`;
        return this.restService.get(path);
    }

    updateAppInstancePermittedRoles(pluginName: string, instanceId: string, roles: string[] | undefined | null) {
        const pageId = this.getCurrentPageId();
        const path = `/pages/${pageId}/portal-app-instances/${pluginName}/${instanceId}/permittedRoles`;
        return this.restService.put(path, roles || []);
    }

    getCurrentPageId() {
        const pageId = (global as any)[WINDOW_VAR_PORTAL_PAGE_ID];
        if (!pageId) {
            throw new Error('Unable to determine the current pageId!');
        }
        return pageId;
    }

    getPage(pageId: string) {
        const path = `/pages/${pageId}`;
        return this.restService.get(path);
    }

    addPage(page: MashroomPortalPage) {
        const path = '/pages';
        return this.restService.post(path, page);
    }

    updatePage(page: MashroomPortalPage) {
        const path = `/pages/${page.pageId}`;
        return this.restService.put(path, page);
    }

    deletePage(pageId: string) {
        const path = `/pages/${pageId}`;
        return this.restService.delete(path);
    }

    getPagePermittedRoles(pageId: string) {
        const path = `/pages/${pageId}/permittedRoles`;
        return this.restService.get(path);
    }

    updatePagePermittedRoles(pageId: string, roles: string[] | undefined | null) {
        const path = `/pages/${pageId}/permittedRoles`;
        return this.restService.put(path, roles || []);
    }

    getCurrentSiteId() {
        const siteId = (global as any)[WINDOW_VAR_PORTAL_SITE_ID];
        if (!siteId) {
            throw new Error('Unable to determine the current siteId!');
        }
        return siteId;
    }

    getSite(siteId: string) {
        const path = `/sites/${siteId}`;
        return this.restService.get(path);
    }

    addSite(site: MashroomPortalSite) {
        const path = '/sites';
        return this.restService.post(path, site);
    }

    updateSite(site: MashroomPortalSite) {
        const path = `/sites/${site.siteId}`;
        return this.restService.put(path, site);
    }

    deleteSite(siteId: string) {
        const path = `/sites/${siteId}`;
        return this.restService.delete(path);
    }

    getSitePermittedRoles(siteId: string) {
        const path = `/sites/${siteId}/permittedRoles`;
        return this.restService.get(path);
    }

    updateSitePermittedRoles(siteId: string, roles: string[] | undefined | null) {
        const path = `/sites/${siteId}/permittedRoles`;
        return this.restService.put(path, roles || []);
    }
}
