
import SitePagesTraverser from '../utils/SitePagesTraverser';
import {PAGES_COLLECTION, SITES_COLLECTION, PORTAL_APP_INSTANCES_COLLECTION} from '../constants';
import {getPortalAppResourceKey} from '../utils/security-utils';

import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {Request} from 'express';
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

    async deleteSite(req: Request, siteId: string): Promise<void> {
        if (!siteId) {
            throw new Error('Cannot delete the site because siteId is undefined!');
        }
        const sitesCollection = await this._getSitesCollections();
        await sitesCollection.deleteOne({siteId});
        await this._deleteSitePermissionsAndUnreferencedPages(req, siteId);
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

    async deletePage(req: Request, pageId: string): Promise<void> {
        if (!pageId) {
            throw new Error('Cannot delete the page because pageId is undefined!');
        }
        const page = await this.getPage(pageId);
        if (page) {
            const pagesCollection = await this._getPagesCollection();
            await pagesCollection.deleteOne({pageId});
            await this._deletePagePermissionsAndAppInstances(req, page);
        }
    }

    async getPortalAppInstance(pluginName: string, instanceId: string | null | undefined): Promise<MashroomPortalAppInstance | null | undefined> {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        return portalAppInstancesCollection.findOne({pluginName, instanceId});
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

    async deletePortalAppInstance(req: Request, pluginName: string, instanceId: string | null | undefined): Promise<void> {
        const portalAppInstancesCollection = await this._getPortalAppInstancesCollection();
        await portalAppInstancesCollection.deleteOne({pluginName, instanceId});
        await this._deletePortalAppInstancePermissions(req, pluginName, instanceId);
    }

    private async _deleteSitePermissionsAndUnreferencedPages(req: Request, siteId: string) {
        await this._getSecurityService().updateResourcePermission(req, {
            type: 'Site',
            key: siteId,
            permissions: null,
        });
        const remainingSites = await this.getSites();
        const pagesCollection = await this._getPagesCollection();
        const pages = await pagesCollection.find();
        const existingPageIds = pages.result.map(({pageId}) => pageId);
        const referencedPageIds: Array<string> = [];
        const addReferencedPageIds = (pageRefs: Array<MashroomPortalPageRef>) => {
            for (const pageRef of pageRefs) {
                referencedPageIds.push(pageRef.pageId);
                if (pageRef.subPages) {
                    addReferencedPageIds(pageRef.subPages);
                }
            }
        };
        for (const site of remainingSites) {
            addReferencedPageIds(site.pages);
        }
        const unreferencedPageIds = existingPageIds.filter((pageId) => referencedPageIds.indexOf(pageId) === -1);
        this._logger.info('Removing unreferenced pages:', unreferencedPageIds);
        for (const pageId of unreferencedPageIds) {
            await this.deletePage(req, pageId);
        }
    }

    private async _deletePagePermissionsAndAppInstances(req: Request, page: MashroomPortalPage) {
        await this._getSecurityService().updateResourcePermission(req, {
            type: 'Page',
            key: page.pageId,
            permissions: null,
        });
        const portalAppReferences = Object.values(page.portalApps ?? {}).flatMap((portalAppReferences) => portalAppReferences);
        for (const {pluginName, instanceId} of portalAppReferences) {
            await this.deletePortalAppInstance(req, pluginName, instanceId);
        }
    }

    private async _deletePortalAppInstancePermissions(req: Request, pluginName: string, instanceId: string | null | undefined) {
        await this._getSecurityService().updateResourcePermission(req, {
            type: 'Portal-App',
            key: getPortalAppResourceKey(pluginName, instanceId),
            permissions: null,
        });
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

    private _getSecurityService(): MashroomSecurityService {
        return this._pluginContextHolder.getPluginContext().services.security!.service;
    }
}

