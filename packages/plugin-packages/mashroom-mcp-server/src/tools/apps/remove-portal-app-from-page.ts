import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {
    MashroomPortalService
} from '@mashroom/mashroom-portal/type-definitions';
import type {Request} from 'express';

export default (req: Request) => async (
    {appName, appInstanceId, pageId}:
    { appName: string, appInstanceId: string, pageId: string }
): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing remove-portal-app-from-page');

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

    page.portalApps![areaId!].splice(portalAppInstancePosition, 1);

    await portalService.updatePage(page);

    await portalService.deletePortalAppInstance(req, appName, appInstanceId);

    return {
        content: [
            {
                type: 'text',
                text: `Success: Portal App Instance "${appInstanceId}" removed from page "${pageId}"`,
            },
        ],
    };
};
