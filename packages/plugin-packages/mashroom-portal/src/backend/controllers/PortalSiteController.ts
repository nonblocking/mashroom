
import {isAdmin, isSitePermitted} from '../utils/security_utils';
import {getPortalPath} from '../utils/path_utils';
import {createPageId, createSiteId} from '../utils/id_utils';
import SitePagesTraverser from '../utils/SitePagesTraverser';

import type {Request, Response} from 'express';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {
    MashroomSecurityResourcePermissions,
    MashroomSecurityService
} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomPortalPage,
    MashroomPortalService,
    MashroomPortalSite,
    MashroomPortalSiteLinkLocalized
} from '../../../type-definitions';

export default class PortalSiteController {

    async getSites(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            const fullSites = await portalService.getSites(100);
            const sites: Array<MashroomPortalSiteLinkLocalized> = [];

            for (const site of fullSites) {
                if (await isSitePermitted(req, site.siteId)) {
                    sites.push({
                        siteId: site.siteId,
                        title: i18nService.translate(req, site.title),
                        path: site.path,
                        url: this._determineSiteUrl(req, site)
                    });
                }
            }

            res.json(sites);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getSite(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const siteId = req.params.siteId;
            const site: MashroomPortalSite | undefined | null = await portalService.getSite(siteId);
            if (!site) {
                logger.warn(`Site with id ${siteId} not found`);
                res.sendStatus(404);
                return;
            }

            res.json(site);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async addSite(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const body = req.body;
            let site: MashroomPortalSite = body;

            if (!site) {
                res.sendStatus(400);
                return;
            }

            const siteId = createSiteId();
            site.siteId = siteId;

            // Add a page if none is given
            if (!site.pages) {
                const page: MashroomPortalPage = {
                    pageId: createPageId()
                };
                await portalService.insertPage(page);
                site = {
                    ...site,
                    pages: [{
                        pageId: page.pageId,
                        title: 'Home',
                        friendlyUrl: '/'
                    }]
                };
            }

            logger.info('Adding site: ', {site});

            await portalService.insertSite(site);

            res.json(site);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updateSite(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const siteId = req.params.siteId;
            const body = req.body;
            const site: MashroomPortalSite = body;

            if (!site) {
                res.sendStatus(400);
                return;
            }

            const existingSite = await portalService.getSite(siteId);
            if (!existingSite) {
                res.sendStatus(404);
                return;
            }

            logger.info('Updating site: ', existingSite);

            const updatedSite = {...existingSite, ...site};

            await portalService.updateSite(updatedSite);

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async deleteSite(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const siteId = req.params.siteId;

            const existingSite = await portalService.getSite(siteId);
            if (!existingSite) {
                res.sendStatus(404);
                return;
            }

            logger.info('Deleting site: ', existingSite);

            await portalService.deleteSite(siteId);

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getSitePermittedRoles(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const siteId = req.params.siteId;

            const site = await portalService.getSite(siteId);
            if (!site) {
                res.sendStatus(404);
                return;
            }

            let roles = null;
            const permissions = await securityService.getResourcePermissions(req, 'Site', siteId);
            if (permissions && permissions.permissions && permissions.permissions.length > 0) {
                roles = permissions.permissions[0].roles;
            }

            res.json(roles);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updateSitePermittedRoles(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const siteId = req.params.siteId;
            const body = req.body;
            const roles: Array<string> | undefined | null = body;

            const site = await portalService.getSite(siteId);
            if (!site) {
                res.sendStatus(404);
                return;
            }

            let permissions: MashroomSecurityResourcePermissions | null = null;
            if (roles && Array.isArray(roles) && roles.length > 0) {
                // Remove duplicates
                const uniqueRoles = Array.from(new Set(roles));

                permissions = [{
                    permissions: ['View'],
                    roles: uniqueRoles
                }];
            }

            logger.info(`Update permitted roles for site ${siteId}:`, {roles});

            await securityService.updateResourcePermission(req, {
                type: 'Site',
                key: siteId,
                permissions
            });

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPageTree(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            const siteId = req.params.siteId;
            const site: MashroomPortalSite | undefined | null = await portalService.getSite(siteId);
            if (!site) {
                logger.warn(`Site with id ${siteId} not found`);
                res.sendStatus(404);
                return;
            }

            const siteTraverser = new SitePagesTraverser(site.pages);
            const pageTree = await siteTraverser.filterAndTranslate(req) || [];

            res.json(pageTree);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    private _determineSiteUrl(req: Request, site: MashroomPortalSite) {
        const portalPath = getPortalPath();
        return `${portalPath}${site.path}`;
    }
}
