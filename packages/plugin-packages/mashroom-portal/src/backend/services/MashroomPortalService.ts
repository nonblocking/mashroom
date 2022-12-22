
import SitePagesTraverser from '../utils/SitePagesTraverser';
import {PAGES_COLLECTION, SITES_COLLECTION, PORTAL_APP_INSTANCES_COLLECTION} from '../constants';

import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';
import type {
    MashroomPortalAppInstance,
    MashroomPortalPage,
    MashroomPortalService as MashroomPortalServiceType,
    MashroomPortalSite,
    MashroomPortalApp,
    MashroomPortalAppEnhancement,
    MashroomPortalLayout,
    MashroomPortalPageEnhancement,
    MashroomPortalPageRef,
    MashroomPortalTheme
} from '../../../type-definitions';
import type {
    MashroomPortalPluginRegistry,
} from '../../../type-definitions/internal';

export default class MashroomPortalService implements MashroomPortalServiceType {

    private _logger: MashroomLogger;

    constructor(private _pluginRegistry: MashroomPortalPluginRegistry, private _pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = _pluginContextHolder.getPluginContext().loggerFactory('mashroom.portal.service');
    }

    getPortalApps(): Readonly<Array<MashroomPortalApp>> {
        return this._pluginRegistry.portalApps;
    }

    getThemes(): Readonly<Array<MashroomPortalTheme>> {
        return this._pluginRegistry.themes;
    }

    getLayouts(): Readonly<Array<MashroomPortalLayout>> {
        return this._pluginRegistry.layouts;
    }

    getPortalPageEnhancements(): Readonly<Array<MashroomPortalPageEnhancement>> {
        return this._pluginRegistry.portalPageEnhancements;
    }

    getPortalAppEnhancements(): Readonly<Array<MashroomPortalAppEnhancement>> {
        return this._pluginRegistry.portalAppEnhancements;
    }

    async getSites(limit?: number): Promise<Array<MashroomPortalSite>> {
        const sitesCollection = await this._getSitesCollections();
        const {result} = await sitesCollection.find(undefined, limit);
        return result;
    }

    async getSite(siteId: string): Promise<MashroomPortalSite | null | undefined> {
        const sitesCollection = await this._getSitesCollections();
        return await sitesCollection.findOne({siteId});
    }

    async findSiteByPath(path: string): Promise<MashroomPortalSite | null | undefined> {
        const sitesCollection = await this._getSitesCollections();
        return await sitesCollection.findOne({path});
    }

    async insertSite(site: MashroomPortalSite): Promise<void> {
        const sitesCollection = await this._getSitesCollections();
        await sitesCollection.insertOne(site);
    }

    async updateSite(site: MashroomPortalSite): Promise<void> {
        const siteId = site.siteId;
        if (!siteId) {
            throw new Error('Cannot update site because siteId is undefined!');
        }
        const sitesCollection = await this._getSitesCollections();
        await sitesCollection.updateOne({siteId}, site);
    }

    async deleteSite(siteId: string): Promise<void> {
        if (!siteId) {
            throw new Error('Cannot delete the site because siteId is undefined!');
        }
        const sitesCollection = await this._getSitesCollections();
        await sitesCollection.deleteOne({siteId});
    }

    async getPage(pageId: string): Promise<MashroomPortalPage | null | undefined> {
        const pagesCollection = await this._getPagesCollection();
        return await pagesCollection.findOne({pageId});
    }

    async findPageRefByFriendlyUrl(site: MashroomPortalSite, friendlyUrl: string): Promise<MashroomPortalPageRef | null | undefined> {
        return new SitePagesTraverser(site.pages).findPageByFriendlyUrl(friendlyUrl);
    }

    async findPageRefByPageId(site: MashroomPortalSite, pageId: string): Promise<MashroomPortalPageRef | null | undefined> {
        return new SitePagesTraverser(site.pages).findPageRefByPageId(pageId);
    }

    async insertPage(page: MashroomPortalPage): Promise<void> {
        const pagesCollection = await this._getPagesCollection();
        await pagesCollection.insertOne(page);
    }

    async updatePage(page: MashroomPortalPage): Promise<void> {
        const pageId = page.pageId;
        if (!pageId) {
            throw new Error('Cannot update page because pageId is undefined!');
        }
        const pagesCollection = await this._getPagesCollection();
        await pagesCollection.updateOne({pageId}, page);
    }

    async deletePage(pageId: string): Promise<void> {
        if (!pageId) {
            throw new Error('Cannot delete the page because pageId is undefined!');
        }
        const pagesCollection = await this._getPagesCollection();
        pagesCollection.deleteOne({pageId});
    }

    async getPortalAppInstance(pluginName: string, instanceId: string | undefined | null): Promise<MashroomPortalAppInstance | null | undefined> {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        return await portalAppInstancesCollection.findOne({pluginName, instanceId});
    }

    async insertPortalAppInstance(portalAppInstance: MashroomPortalAppInstance): Promise<void> {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        await portalAppInstancesCollection.insertOne(portalAppInstance);
    }

    async updatePortalAppInstance(portalAppInstance: MashroomPortalAppInstance): Promise<void> {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        const pluginName = portalAppInstance.pluginName;
        const instanceId = portalAppInstance.instanceId;
        await portalAppInstancesCollection.updateOne({pluginName, instanceId}, portalAppInstance);
    }

    async deletePortalAppInstance(pluginName: string, instanceId: string | undefined | null): Promise<void> {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        await portalAppInstancesCollection.deleteOne({pluginName, instanceId});
    }

    private async _getSitesCollections(): Promise<MashroomStorageCollection<MashroomPortalSite>> {
        return this._getStorageService().getCollection(SITES_COLLECTION);
    }

    private async _getPagesCollection(): Promise<MashroomStorageCollection<MashroomPortalPage>> {
        return this._getStorageService().getCollection(PAGES_COLLECTION);
    }

    private async _getPortalAppInstancesCollection(): Promise<MashroomStorageCollection<MashroomPortalAppInstance>> {
        return this._getStorageService().getCollection(PORTAL_APP_INSTANCES_COLLECTION);
    }

    private _getStorageService(): MashroomStorageService {
        return this._pluginContextHolder.getPluginContext().services.storage!.service;
    }

}

