// @flow

import SitePagesTraverser from '../utils/SitePagesTraverser';
import {PAGES_COLLECTION, SITES_COLLECTION, PORTAL_APP_INSTANCES_COLLECTION} from '../constants';

import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';
import type {
    MashroomPortalAppInstance, MashroomPortalPage,
    MashroomPortalService as MashroomPortalServiceType,
    MashroomPortalSite,
} from '../../../type-definitions';
import type {
    MashroomPortalPluginRegistry,
} from '../../../type-definitions/internal';

export default class MashroomPortalService implements MashroomPortalServiceType {

    _pluginRegistry: MashroomPortalPluginRegistry;
    _pluginContextHolder: MashroomPluginContextHolder;
    _logger: MashroomLogger;

    constructor(pluginRegistry: MashroomPortalPluginRegistry, pluginContextHolder: MashroomPluginContextHolder) {
        this._pluginRegistry = pluginRegistry;
        this._pluginContextHolder = pluginContextHolder;
        this._logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.portal.service');
    }

    getPortalApps() {
        return this._pluginRegistry.portalApps;
    }

    getThemes() {
        return this._pluginRegistry.themes;
    }

    getLayouts() {
        return this._pluginRegistry.layouts;
    }

    async getSites(limit?: number): Promise<Array<MashroomPortalSite>> {
        const sitesCollection = await this._getSitesCollections();
        return await sitesCollection.find(undefined, limit);
    }

    async getSite(siteId: string) {
        const sitesCollection = await this._getSitesCollections();
        return await sitesCollection.findOne({siteId});
    }

    async findSiteByPath(path: string) {
        const sitesCollection = await this._getSitesCollections();
        return await sitesCollection.findOne({path});
    }

    async insertSite(site: MashroomPortalSite) {
        const sitesCollection = await this._getSitesCollections();
        await sitesCollection.insertOne(site);
    }

    async updateSite(site: MashroomPortalSite) {
        const siteId = site.siteId;
        if (!siteId) {
            throw new Error('Cannot update site because siteId is undefined!');
        }
        const sitesCollection = await this._getSitesCollections();
        await sitesCollection.updateOne({siteId}, site);
    }

    async deleteSite(siteId: string) {
        if (!siteId) {
            throw new Error('Cannot delete the site because siteId is undefined!');
        }
        const sitesCollection = await this._getSitesCollections();
        sitesCollection.deleteOne({siteId});
    }

    async getPage(pageId: string) {
        const pagesCollection = await this._getPagesCollection();
        return await pagesCollection.findOne({pageId});
    }

    async findPageRefByFriendlyUrl(site: MashroomPortalSite, friendlyUrl: string) {
        return new SitePagesTraverser(site.pages).findPageByFriendlyUrl(friendlyUrl);
    }

    async insertPage(page: MashroomPortalPage) {
        const pagesCollection = await this._getPagesCollection();
        await pagesCollection.insertOne(page);
    }

    async updatePage(page: MashroomPortalPage) {
        const pageId = page.pageId;
        if (!pageId) {
            throw new Error('Cannot update page because pageId is undefined!');
        }
        const pagesCollection = await this._getPagesCollection();
        await pagesCollection.updateOne({pageId}, page);
    }

    async deletePage(pageId: string) {
        if (!pageId) {
            throw new Error('Cannot delete the page because pageId is undefined!');
        }
        const pagesCollection = await this._getPagesCollection();
        pagesCollection.deleteOne({pageId});
    }

    async getPortalAppInstance(pluginName: string, instanceId: ?string) {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        return await portalAppInstancesCollection.findOne({pluginName, instanceId});
    }

    async insertPortalAppInstance(portalAppInstance: MashroomPortalAppInstance) {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        await portalAppInstancesCollection.insertOne(portalAppInstance);
    }

    async updatePortalAppInstance(portalAppInstance: MashroomPortalAppInstance) {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        const pluginName = portalAppInstance.pluginName;
        const instanceId = portalAppInstance.instanceId;
        await portalAppInstancesCollection.updateOne({pluginName, instanceId}, portalAppInstance);
    }

    async deletePortalAppInstance(pluginName: string, instanceId: ?string) {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        await portalAppInstancesCollection.deleteOne({pluginName, instanceId});
    }

    async _getSitesCollections(): Promise<MashroomStorageCollection<MashroomPortalSite>> {
        return this._getStorageService().getCollection(SITES_COLLECTION);
    }

    async _getPagesCollection(): Promise<MashroomStorageCollection<MashroomPortalPage>> {
        return this._getStorageService().getCollection(PAGES_COLLECTION);
    }

    async _getPortalAppInstancesCollection(): Promise<MashroomStorageCollection<MashroomPortalAppInstance>> {
        return this._getStorageService().getCollection(PORTAL_APP_INSTANCES_COLLECTION);
    }

    _getStorageService(): MashroomStorageService {
        return this._pluginContextHolder.getPluginContext().services.storage.service;
    }

}

