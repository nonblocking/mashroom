
import {findPortalAppInstanceOnPage} from '../utils/model_utils';
import {getPortalAppResourceKey, isAdmin} from '../utils/security_utils';
import {createPageId, createAppInstanceId} from '../utils/id_utils';

import type {Request, Response} from 'express';
import type {
    MashroomSecurityResourcePermissions,
    MashroomSecurityService
} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomCreatePagePortalAppInstance,
    MashroomPagePortalAppInstance,
    MashroomPortalAppInstance,
    MashroomPortalAppInstanceRef,
    MashroomPortalPage,
    MashroomPortalService,
    MashroomUpdatePagePortalAppInstance
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry, Writable} from '../../../type-definitions/internal';

export default class PortalPageController {

    constructor(private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    async getPortalPage(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId;
            const page: MashroomPortalPage | undefined | null = await portalService.getPage(pageId);
            if (!page) {
                logger.warn(`Page with id ${pageId} not found`);
                res.sendStatus(404);
                return;
            }

            res.json(page);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async addPage(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            let page: MashroomPortalPage = req.body;

            if (!page) {
                res.sendStatus(400);
                return;
            }

            const pageId = createPageId();
            page = {
                ...page,
                pageId,
            };

            logger.info('Adding page: ', page);

            await portalService.insertPage(page);

            res.json(page);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updatePage(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId;
            const page: MashroomPortalPage = req.body;

            if (!page) {
                res.sendStatus(400);
                return;
            }

            const existingPage = await portalService.getPage(pageId);
            if (!existingPage) {
                res.sendStatus(404);
                return;
            }

            logger.info('Updating page: ', existingPage);

            const updatedPage = {...existingPage, ...page};

            await portalService.updatePage(updatedPage);

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async deletePage(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId;

            const existingPage = await portalService.getPage(pageId);
            if (!existingPage) {
                res.sendStatus(404);
                return;
            }

            logger.info('Deleting page: ', existingPage);

            await portalService.deletePage(pageId);

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPagePermittedRoles(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId;
            const page = await portalService.getPage(pageId);
            if (!page) {
                res.sendStatus(404);
                return;
            }

            let roles = null;
            const permissions = await securityService.getResourcePermissions(req, 'Page', pageId);
            if (permissions && permissions.permissions && permissions.permissions.length > 0) {
                roles = permissions.permissions[0].roles;
            }

            res.json(roles);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updatePagePermittedRoles(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId as string;
            const roles: Array<string> | undefined | null = req.body;

            const page = await portalService.getPage(pageId);
            if (!page) {
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

            logger.info(`Update permitted roles for page ${pageId}:`, {roles});

            await securityService.updateResourcePermission(req, {
                type: 'Page',
                key: pageId,
                permissions
            });

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPortalAppInstances(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            const pageId = req.params.pageId;
            const page = await portalService.getPage(pageId);
            if (!page) {
                logger.warn(`Page with id ${pageId} not found`);
                res.sendStatus(404);
                return;
            }

            const instances: Array<MashroomPagePortalAppInstance> = [];
            if (page.portalApps) {
                for (const areaId in page.portalApps) {
                    const apps = page.portalApps[areaId];
                    apps.forEach((a, idx) => instances.push({
                        pluginName: a.pluginName,
                        instanceId: a.instanceId,
                        areaId,
                        position: idx,
                    }));
                }
            }

            res.json(instances);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async addPortalApp(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId;
            const data: MashroomCreatePagePortalAppInstance = req.body;

            const page = await portalService.getPage(pageId);
            if (!page) {
                logger.warn(`Page with id ${pageId} not found`);
                res.sendStatus(404);
                return;
            }

            const portalApp = this._getAppData(data.pluginName);
            if (!portalApp) {
                logger.warn(`Portal app ${data.pluginName} not found`);
                res.sendStatus(400);
                return;
            }

            const appConfig = {...portalApp.defaultAppConfig || {}, ...data.appConfig || {}};

            const instanceId = createAppInstanceId();
            const instance = {
                pluginName: data.pluginName,
                instanceId
            };
            const position = this._insertAppInstance(page, instance, data.areaId, data.position);
            logger.info(`Inserting new app instance of ${data.pluginName} on page ${pageId} in area ${data.areaId} at position: ${position}`);

            await portalService.updatePage(page);

            const appInstance: MashroomPortalAppInstance = {
                pluginName: data.pluginName,
                instanceId,
                appConfig,
            };

            await portalService.insertPortalAppInstance(appInstance);

            if (portalApp.defaultRestrictViewToRoles && Array.isArray(portalApp.defaultRestrictViewToRoles) && portalApp.defaultRestrictViewToRoles.length > 0) {
                await securityService.updateResourcePermission(req, {
                    type: 'Portal-App',
                    key: getPortalAppResourceKey(data.pluginName, instanceId),
                    permissions: [{
                        permissions: ['View'],
                        roles: portalApp.defaultRestrictViewToRoles || []
                    }]
                });
            }

            const result: MashroomPagePortalAppInstance = {
                pluginName: data.pluginName,
                instanceId,
                areaId: data.areaId,
                position,
            };

            res.json(result);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updatePortalApp(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId;
            const pluginName = req.params.pluginName;
            const portalAppInstanceId = req.params.portalAppInstanceId;
            const data: MashroomUpdatePagePortalAppInstance = req.body;

            const page = await portalService.getPage(pageId);
            if (!page) {
                logger.warn(`Page with id ${pageId} not found`);
                res.sendStatus(404);
                return;
            }

            const portalApps = page.portalApps;
            const existingInstData = findPortalAppInstanceOnPage(page, pluginName, portalAppInstanceId);
            if (!portalApps || !existingInstData) {
                logger.warn(`No portal app instance ${pluginName}:${portalAppInstanceId} found on page with id ${pageId}`);
                res.sendStatus(404);
                return;
            }

            if (data.areaId && data.areaId !== existingInstData.areaId || typeof (data.position) === 'number' && data.position !== existingInstData.position) {
                const areaId = data.areaId || existingInstData.areaId;
                portalApps[existingInstData.areaId].splice(existingInstData.position, 1);
                const position = this._insertAppInstance(page, existingInstData.instance, areaId, data.position);
                logger.info(`Moving app instance ${pluginName}:${portalAppInstanceId} on page ${pageId} and area ${areaId} to position: ${position}`);
            }
            if (data.appConfig) {
                logger.info(`Updating app config of app instance ${pluginName}:${portalAppInstanceId} on page ${pageId} to: `, data.appConfig);
                const existingAppInstance = await portalService.getPortalAppInstance(pluginName, portalAppInstanceId);
                if (existingAppInstance) {
                    const updatedAppInstance = {...existingAppInstance, appConfig: data.appConfig,};
                    await portalService.updatePortalAppInstance(updatedAppInstance);
                }
            }

            await portalService.updatePage(page);

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async removePortalApp(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId;
            const pluginName = req.params.pluginName;
            const portalAppInstanceId = req.params.portalAppInstanceId;

            const page = await portalService.getPage(pageId);
            if (!page) {
                logger.warn(`Page with id ${pageId} not found`);
                res.sendStatus(404);
                return;
            }

            const portalApps = page.portalApps;
            const existingInstData = findPortalAppInstanceOnPage(page, pluginName, portalAppInstanceId);
            if (!portalApps || !existingInstData) {
                logger.warn(`No portal app instance ${pluginName}:${portalAppInstanceId} found on page with id ${pageId}`);
                res.sendStatus(404);
                return;
            }

            logger.info(`Removing app instance ${pluginName}:${portalAppInstanceId} on page ${pageId}`);
            portalApps[existingInstData.areaId].splice(existingInstData.position, 1);

            await portalService.updatePage(page);

            await portalService.deletePortalAppInstance(pluginName, portalAppInstanceId);

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPortalAppPermittedRoles(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId = req.params.pageId;
            const pluginName = req.params.pluginName;
            const portalAppInstanceId = req.params.portalAppInstanceId;

            logger.info(`Updating permitted roles for app ${pluginName} instance ${portalAppInstanceId} on page ${pageId}`);

            const page = await portalService.getPage(pageId);
            if (!page) {
                logger.warn(`Page with id ${pageId} not found`);
                res.sendStatus(404);
                return;
            }

            const portalApps = page.portalApps;
            const existingInstData = findPortalAppInstanceOnPage(page, pluginName, portalAppInstanceId);
            if (!portalApps || !existingInstData) {
                logger.warn(`No portal app instance ${pluginName}:${portalAppInstanceId} found on page with id ${pageId}`);
                res.sendStatus(404);
                return;
            }

            let roles = null;
            const permissions = await securityService.getResourcePermissions(req, 'Portal-App', getPortalAppResourceKey(pluginName, portalAppInstanceId));
            if (permissions && permissions.permissions && permissions.permissions.length > 0) {
                roles = permissions.permissions[0].roles;
            }

            res.json(roles);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updatePortalAppPermittedRoles(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: string = req.params.pageId;
            const pluginName: string = req.params.pluginName;
            const portalAppInstanceId: string = req.params.portalAppInstanceId;
            const roles: Array<string> | undefined | null = req.body;

            logger.info(`Updating permitted roles for app ${pluginName} instance ${portalAppInstanceId} on page ${pageId}`);

            const page = await portalService.getPage(pageId);
            if (!page) {
                logger.warn(`Page with id ${pageId} not found`);
                res.sendStatus(404);
                return;
            }

            const portalApps = page.portalApps;
            const existingInstData = findPortalAppInstanceOnPage(page, pluginName, portalAppInstanceId);
            if (!portalApps || !existingInstData) {
                logger.warn(`No portal app instance ${pluginName}:${portalAppInstanceId} found on page with id ${pageId}`);
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

            await securityService.updateResourcePermission(req, {
                type: 'Portal-App',
                key: getPortalAppResourceKey(pluginName, portalAppInstanceId),
                permissions
            });

            res.end();

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    private _insertAppInstance(page: MashroomPortalPage, portalAppInstance: MashroomPortalAppInstanceRef, areaId: string, position?: number): number {
        (page as Writable<MashroomPortalPage>).portalApps = page.portalApps || {};
        const areaAppInstances = page.portalApps![areaId] = page.portalApps![areaId] || [];

        let actualPos = areaAppInstances.length;
        if (typeof (position) === 'number' && position >= 0 && position < areaAppInstances.length) {
            actualPos = position;
        }

        areaAppInstances.splice(actualPos, 0, portalAppInstance);

        return actualPos;
    }

    private _getAppData(pluginName: string) {
        return this._pluginRegistry.portalApps.find((a) => a.name === pluginName);
    }

}
