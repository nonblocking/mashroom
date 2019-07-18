// @flow

import shortId from 'shortid';

import {findPortalAppInstanceOnPage} from '../utils/model_utils';
import {getPortalAppResourceKey, isAdmin} from '../utils/security_utils';

import type {
    ExpressRequest,
    ExpressResponse, MashroomLogger
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityResourcePermissions,
    MashroomSecurityService
} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomPortalPage,
    MashroomPortalPluginRegistry,
    MashroomPagePortalAppInstance,
    MashroomPortalAppInstanceRef,
    MashroomCreatePagePortalAppInstance,
    MashroomUpdatePagePortalAppInstance,
    MashroomPortalAppInstance,
    MashroomPortalService
} from '../../../type-definitions';

export default class PortalPageController {

    pluginRegistry: MashroomPortalPluginRegistry;

    constructor(pluginRegistry: MashroomPortalPluginRegistry) {
        this.pluginRegistry = pluginRegistry;
    }

    async getPortalPage(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: any = req.params.pageId;
            const page: ?MashroomPortalPage = await portalService.getPage(pageId);
            if (!page) {
                logger.warn(`Page with id ${pageId} not found`);
                res.sendStatus(404);
                return;
            }

            res.json(page);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async addPage(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const body: any = req.body;
            const page: MashroomPortalPage = body;

            if (!page) {
                res.sendStatus(400);
                return;
            }

            const pageId = shortId.generate();
            page.pageId = pageId;

            logger.info('Adding page: ', page);

            await portalService.insertPage(page);

            res.json(page);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updatePage(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: any = req.params.pageId;
            const body: any = req.body;
            const page: MashroomPortalPage = body;

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

            const updatedPage = Object.assign({}, existingPage, page);

            await portalService.updatePage(updatedPage);

            res.end();

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async deletePage(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: any = req.params.pageId;

            const existingPage = await portalService.getPage(pageId);
            if (!existingPage) {
                res.sendStatus(404);
                return;
            }

            logger.info('Deleting page: ', existingPage);

            await portalService.deletePage(pageId);

            res.end();

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPagePermittedRoles(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: any = req.params.pageId
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updatePagePermittedRoles(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: any = req.params.pageId;
            const body: any = req.body;
            const roles: ?Array<string> = body;

            const page = await portalService.getPage(pageId);
            if (!page) {
                res.sendStatus(404);
                return;
            }

            let permissions: ?MashroomSecurityResourcePermissions = null;
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPortalAppInstances(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            const pageId: any = req.params.pageId;
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async addPortalApp(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
            const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: string = req.params.pageId;
            const body: any = req.body;
            const data: MashroomCreatePagePortalAppInstance = body;

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

            const appConfig = Object.assign({}, portalApp.defaultAppConfig || {}, data.appConfig || {});

            const instanceId = shortId.generate();
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

            if (portalApp.defaultRestrictedToRoles && Array.isArray(portalApp.defaultRestrictedToRoles)) {
                await securityService.updateResourcePermission(req, {
                    type: 'Portal-App',
                    key: getPortalAppResourceKey(data.pluginName, instanceId),
                    permissions: [{
                        permissions: ['View'],
                        roles: portalApp.defaultRestrictedToRoles || []
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updatePortalApp(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: string = req.params.pageId;
            const pluginName: string = req.params.pluginName;
            const portalAppInstanceId: string = req.params.portalAppInstanceId;
            const body: any = req.body;
            const data: MashroomUpdatePagePortalAppInstance = body;

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

            if (data.areaId && data.areaId !== existingInstData.areaId || data.position && data.position !== existingInstData.position) {
                const areaId = data.areaId || existingInstData.areaId;
                portalApps[existingInstData.areaId].splice(existingInstData.position, 1);
                const position = this._insertAppInstance(page, existingInstData.instance, areaId, data.position);
                logger.info(`Moving app instance ${pluginName}:${portalAppInstanceId} on page ${pageId} and area ${areaId} to position: ${position}`);
            }
            if (data.appConfig) {
                logger.info(`Updating app config of app instance ${pluginName}:${portalAppInstanceId} on page ${pageId} to: `, data.appConfig);
                const existingAppInstance = await portalService.getPortalAppInstance(pluginName, portalAppInstanceId);
                if (existingAppInstance) {
                    const updatedAppInstance = Object.assign({}, existingAppInstance, {
                        appConfig: data.appConfig,
                    });
                    await portalService.updatePortalAppInstance(updatedAppInstance);
                }
            }

            await portalService.updatePage(page);

            res.end();

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async removePortalApp(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

            if (!isAdmin(req)) {
                res.sendStatus(403);
                return;
            }

            const pageId: string = req.params.pageId;
            const pluginName: string = req.params.pluginName;
            const portalAppInstanceId: string = req.params.portalAppInstanceId;

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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async getPortalAppPermittedRoles(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async updatePortalAppPermittedRoles(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

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
            const body: any = req.body;
            const roles: ?Array<string> = body;

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

            let permissions: ?MashroomSecurityResourcePermissions = null;
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

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    _insertAppInstance(page: MashroomPortalPage, portalAppInstance: MashroomPortalAppInstanceRef, areaId: string, position?: number): number {
        page.portalApps = page.portalApps || {};
        const areaAppInstances = page.portalApps[areaId] = page.portalApps[areaId] || [];

        let actualPos = areaAppInstances.length;
        if (typeof(position) === 'number' && position >= 0 && position < areaAppInstances.length) {
            actualPos = position;
        }

        areaAppInstances.splice(actualPos, 0, portalAppInstance);

        return actualPos;
    }

    _getAppData(pluginName: string) {
        return this.pluginRegistry.portalApps.find((a) => a.name === pluginName);
    }

}
