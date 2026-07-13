import {determineServerUrl, determineSiteAndPageRef, getPortalAppResourceKey, insertAppInstance} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {
    MashroomPortalAppInstance,
    MashroomPortalAppInstanceRef,
    MashroomPortalService
} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

export default (req: Request) => async (
    {appName, pageId, areaId, position = 0, overrideAppConfig = {}}:
    {
        appName: string,
        pageId: string,
        areaId: string,
        position?: number,
        overrideAppConfig?: object
    }): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;
    const securityService: MashroomSecurityService = services.security!.service;

    logger.info('Executing add-portal-app-to-page');

    const page = await portalService.getPage(pageId);
    if (!page) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: No page with ID "${pageId}" found.`,
                },
            ],
        };
    }

    const { site, pageRef } = await determineSiteAndPageRef(pageId, pluginContext);
    const serverUrl = determineServerUrl(req);
    const pageUrl = `${serverUrl}${site?.path}${pageRef?.friendlyUrl}`;

    const portalApp = portalService.getPortalApps().find((a) => a.name === appName);
    if (!portalApp) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: No Portal App with name "${appName}" found.`,
                },
            ],
        };
    }

    const portalAppInstance: MashroomPortalAppInstanceRef = {
        pluginName: appName,
        instanceId: crypto.randomUUID(),
    };

    const actualPos = insertAppInstance(page, portalAppInstance, areaId, position);

    await portalService.updatePage(page);

    const appConfig = {...portalApp.defaultAppConfig ?? {}, ...overrideAppConfig ?? {}};

    const appInstance: MashroomPortalAppInstance = {
        ...portalAppInstance,
        appConfig,
    };

    await portalService.insertPortalAppInstance(appInstance);

    if (portalApp.defaultRestrictViewToRoles && Array.isArray(portalApp.defaultRestrictViewToRoles) && portalApp.defaultRestrictViewToRoles.length > 0) {
        await securityService.updateResourcePermission(req, {
            type: 'Portal-App',
            key: getPortalAppResourceKey(appName, appInstance.instanceId),
            permissions: [{
                permissions: ['View'],
                roles: portalApp.defaultRestrictViewToRoles || []
            }]
        });
    }

    return {
        content: [
            {
                type: 'text',
                text: `Success: Portal App "${appName}" added to page "${pageId}" at position ${actualPos} in area "${areaId}. App Instance ID: ${appInstance.instanceId}. Full page URL: ${pageUrl}`,
            },
        ],
    };
};
