import {insertAppInstance} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomPortalService} from '@mashroom/mashroom-portal/type-definitions';

export default (req: Request) => async (
    {appName, appInstanceId, pageId, newAreaId, newPosition = 0}:
    { appName: string, appInstanceId: string, pageId: string, newAreaId: string, newPosition?: number }
): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing move-portal-app-on-page');

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

    const areaId = Object.keys(page.portalApps ?? {}).find((areaId) => page.portalApps?.[areaId]?.some((app) => app.instanceId === appInstanceId));
    let portalAppInstancePosition = -1;
    if (areaId) {
        portalAppInstancePosition = page.portalApps![areaId].findIndex((app) => app.instanceId === appInstanceId);
    }

    if (portalAppInstancePosition === -1) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: No Instance of Portal App ${appName} IO "${appInstanceId}" found.`,
                },
            ],
        };
    }

    const portalAppInstance = page.portalApps![areaId!].splice(portalAppInstancePosition, 1)[0];
    const actualPos = insertAppInstance(page, portalAppInstance, newAreaId, newPosition);

    await portalService.updatePage(page);

    return {
        content: [
            {
                type: 'text',
                text: `Success: Portal App "${appName}" with Instance ID ${appInstanceId} moved to position ${actualPos} in area "${newAreaId}"`,
            },
        ],
    };
};
