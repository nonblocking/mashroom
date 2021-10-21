
import {WINDOW_VAR_PORTAL_API_PATH, WINDOW_VAR_PORTAL_PAGE_ID, WINDOW_VAR_PORTAL_SITE_ID} from '../../../backend/constants';

import type {MashroomPluginConfig} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalAdminService,
    MashroomCreatePagePortalAppInstance,
    MashroomUpdatePagePortalAppInstance,
    MashroomPortalPage,
    MashroomPortalSite,
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPagePortalAppInstance,
    RoleDefinition,
} from '../../../../type-definitions';
import type {MashroomRestService} from '../../../../type-definitions/internal';

export default class MashroomPortalAppServiceImpl implements MashroomPortalAdminService {

    private _restService: MashroomRestService;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
    }

    getAvailableThemes(): Promise<Array<MashroomAvailablePortalTheme>> {
        const path = `/themes`;
        return this._restService.get(path);
    }

    getAvailableLayouts(): Promise<Array<MashroomAvailablePortalLayout>> {
        const path = `/layouts`;
        return this._restService.get(path);
    }

    getExistingRoles(): Promise<Array<RoleDefinition>> {
        const path = `/roles`;
        return this._restService.get(path);
    }

    getAppInstances(): Promise<Array<MashroomPagePortalAppInstance>> {
        const pageId = this.getCurrentPageId();
        const path = `/pages/${pageId}/portal-app-instances`;
        return this._restService.get(path);
    }

    addAppInstance(pluginName: string, areaId: string, position?: number, appConfig?: MashroomPluginConfig): Promise<MashroomPagePortalAppInstance> {
        const pageId = this.getCurrentPageId();
        const data: MashroomCreatePagePortalAppInstance = {
            pluginName,
            areaId,
            position,
            appConfig,
        };

        const path = `/pages/${pageId}/portal-app-instances`;
        return this._restService.post(path, data);
    }

    updateAppInstance(pluginName: string, instanceId: string, areaId: string | undefined | null, position: number | undefined | null,
                      appConfig: MashroomPluginConfig | undefined | null): Promise<void> {
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
        return this._restService.put(path, data);
    }

    removeAppInstance(pluginName: string, instanceId: string): Promise<void> {
        const pageId = this.getCurrentPageId();
        const path = `/pages/${pageId}/portal-app-instances/${pluginName}/${instanceId}`;
        return this._restService.delete(path);
    }

    getAppInstancePermittedRoles(pluginName: string, instanceId: string): Promise<string[] | null | undefined> {
        const pageId = this.getCurrentPageId();
        const path = `/pages/${pageId}/portal-app-instances/${pluginName}/${instanceId}/permittedRoles`;
        return this._restService.get(path);
    }

    updateAppInstancePermittedRoles(pluginName: string, instanceId: string, roles: string[] | undefined | null): Promise<void> {
        const pageId = this.getCurrentPageId();
        const path = `/pages/${pageId}/portal-app-instances/${pluginName}/${instanceId}/permittedRoles`;
        return this._restService.put(path, roles || []);
    }

    getCurrentPageId(): string {
        const pageId = (global as any)[WINDOW_VAR_PORTAL_PAGE_ID];
        if (!pageId) {
            throw new Error('Unable to determine the current pageId!');
        }
        return pageId;
    }

    getPage(pageId: string): Promise<MashroomPortalPage> {
        const path = `/pages/${pageId}`;
        return this._restService.get(path);
    }

    addPage(page: MashroomPortalPage): Promise<MashroomPortalPage> {
        const path = '/pages';
        return this._restService.post(path, page);
    }

    updatePage(page: MashroomPortalPage): Promise<void> {
        const path = `/pages/${page.pageId}`;
        return this._restService.put(path, page);
    }

    deletePage(pageId: string): Promise<void> {
        const path = `/pages/${pageId}`;
        return this._restService.delete(path);
    }

    getPagePermittedRoles(pageId: string): Promise<string[] | null | undefined> {
        const path = `/pages/${pageId}/permittedRoles`;
        return this._restService.get(path);
    }

    updatePagePermittedRoles(pageId: string, roles: string[] | undefined | null): Promise<void> {
        const path = `/pages/${pageId}/permittedRoles`;
        return this._restService.put(path, roles || []);
    }

    getCurrentSiteId(): string {
        const siteId = (global as any)[WINDOW_VAR_PORTAL_SITE_ID];
        if (!siteId) {
            throw new Error('Unable to determine the current siteId!');
        }
        return siteId;
    }

    getSite(siteId: string): Promise<MashroomPortalSite> {
        const path = `/sites/${siteId}`;
        return this._restService.get(path);
    }

    addSite(site: MashroomPortalSite): Promise<MashroomPortalSite> {
        const path = '/sites';
        return this._restService.post(path, site);
    }

    updateSite(site: MashroomPortalSite): Promise<void> {
        const path = `/sites/${site.siteId}`;
        return this._restService.put(path, site);
    }

    deleteSite(siteId: string): Promise<void> {
        const path = `/sites/${siteId}`;
        return this._restService.delete(path);
    }

    getSitePermittedRoles(siteId: string): Promise<string[] | null | undefined> {
        const path = `/sites/${siteId}/permittedRoles`;
        return this._restService.get(path);
    }

    updateSitePermittedRoles(siteId: string, roles: string[] | undefined | null): Promise<void> {
        const path = `/sites/${siteId}/permittedRoles`;
        return this._restService.put(path, roles || []);
    }
}
