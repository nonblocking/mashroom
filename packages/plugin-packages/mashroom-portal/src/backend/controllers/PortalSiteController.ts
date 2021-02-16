
import shortId from 'shortid';
import {isAdmin, isSitePermitted} from '../utils/security_utils';
import {getPortalPath} from '../utils/path_utils';
import SitePagesTraverser from '../utils/SitePagesTraverser';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';
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
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');
        const i18nService: MashroomI18NService = reqWithContext.pluginContext.services.i18n.service;

        try {
            const portalService: MashroomPortalService = reqWithContext.pluginContext.services.portal.service;

            const fullSites = await portalService.getSites(100);
            const sites: Array<MashroomPortalSiteLinkLocalized> = [];

            for (const site of fullSites) {
                if (await isSitePermitted(reqWithContext, site.siteId)) {
                    sites.push({
                        siteId: site.siteId,
                        title: i18nService.translate(reqWithContext, site.title),
                        path: site.path,
                        url: this.determineSiteUrl(reqWithContext, site)
                    });
                }
            }

            res.json(sites);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getSite(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = reqWithContext.pluginContext.services.portal.service;

            if (!isAdmin(reqWithContext)) {
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async addSite(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = reqWithContext.pluginContext.services.portal.service;

            if (!isAdmin(reqWithContext)) {
                res.sendStatus(403);
                return;
            }

            const body = req.body;
            let site: MashroomPortalSite = body;

            if (!site) {
                res.sendStatus(400);
                return;
            }

            const siteId = shortId.generate();
            site.siteId = siteId;

            // Add a page if none is given
            if (!site.pages) {
                const page: MashroomPortalPage = {
                    pageId: shortId.generate()
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updateSite(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = reqWithContext.pluginContext.services.portal.service;

            if (!isAdmin(reqWithContext)) {
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async deleteSite(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = reqWithContext.pluginContext.services.portal.service;

            if (!isAdmin(reqWithContext)) {
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getSitePermittedRoles(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = reqWithContext.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = reqWithContext.pluginContext.services.security.service;

            if (!isAdmin(reqWithContext)) {
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
            const permissions = await securityService.getResourcePermissions(reqWithContext, 'Site', siteId);
            if (permissions && permissions.permissions && permissions.permissions.length > 0) {
                roles = permissions.permissions[0].roles;
            }

            res.json(roles);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updateSitePermittedRoles(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = reqWithContext.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = reqWithContext.pluginContext.services.security.service;

            if (!isAdmin(reqWithContext)) {
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

            await securityService.updateResourcePermission(reqWithContext, {
                type: 'Site',
                key: siteId,
                permissions
            });

            res.end();

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPageTree(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = reqWithContext.pluginContext.services.portal.service;

            const siteId = req.params.siteId;
            const site: MashroomPortalSite | undefined | null = await portalService.getSite(siteId);
            if (!site) {
                logger.warn(`Site with id ${siteId} not found`);
                res.sendStatus(404);
                return;
            }

            const siteTraverser = new SitePagesTraverser(site.pages);
            const pageTree = await siteTraverser.filterAndTranslate(reqWithContext) || [];

            res.json(pageTree);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    private determineSiteUrl(req: ExpressRequest, site: MashroomPortalSite) {
        const portalPath = getPortalPath();
        return `${portalPath}${site.path}`;
    }
}
