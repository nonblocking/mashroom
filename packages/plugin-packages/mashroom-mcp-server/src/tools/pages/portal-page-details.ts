import {readFile} from 'fs/promises';
import {determineServerUrl, determineSiteAndPageRef, serializeI18NString} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomPortalService} from '@mashroom/mashroom-portal/type-definitions';

export default (req: Request) => async ({ pageId }: { pageId: string }): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing portal-page-details with pageId:', pageId);

    const page = await portalService.getPage(pageId);
    if (!page) {
        return {
            content: [
                {
                    type: 'text',
                    text: `No page with ID "${pageId}" found.`,
                },
            ],
        };
    }

    const { site, pageRef } = await determineSiteAndPageRef(pageId, pluginContext);
    const serverUrl = determineServerUrl(req);
    const pageUrl = `${serverUrl}${site?.path}${pageRef?.friendlyUrl}`;

    const layoutName = page.layout ?? site?.defaultLayout;
    const layoutAreaIds: Array<string> = [];
    if (layoutName) {
        const layout = portalService.getLayouts().find((p) => p.name === layoutName);
        if (layout) {
            try {
                const layoutTemplate = await readFile(layout.layoutPath, { encoding: 'utf-8' });
                Array.from(layoutTemplate.matchAll(/ id=["'](.+)["']/g)).forEach((match) => layoutAreaIds.push(match[1]));
            } catch (e) {
                logger.warn(`Error reading layout file: ${layout.layoutPath}`, e);
            }
        }
    }

    const appLines = Object.keys(page.portalApps ?? {}).flatMap((areaCode, idx) =>
        page.portalApps![areaCode].map((app) =>
            `${idx + 1}. Name: ${app.pluginName}, Instance ID: ${app.instanceId}, Area ID: ${areaCode}`
        )
    );

    return {
        content: [
            {
                type: 'text',
                text: `
Page "${pageId}" Details:

Title: ${serializeI18NString(pageRef?.title, pluginContext)}
Description: ${page.description}
FriendlyUrl: ${pageRef?.friendlyUrl ?? '(none)'}
Full URL: ${pageUrl}
Layout: ${layoutName ?? '(none)'}
Layout Area IDs: ${layoutAreaIds.join(', ')}
Apps on the Page:
    ${appLines.join('\n')}
                `,
            },
        ],
    };
};
