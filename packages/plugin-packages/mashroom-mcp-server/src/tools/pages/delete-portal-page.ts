import {determineSiteAndPageRef, getNestedPages, removePageFromTree} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomPortalService} from '@mashroom/mashroom-portal/type-definitions';

export default (req: Request) => async ({ pageId }: { pageId: string  }): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing delete-portal-page');

    const { site, pageRef, parentPageRef } = await determineSiteAndPageRef(pageId, pluginContext) ?? {};

    if (!site || !pageRef) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: No Page with ID "${pageId}" found.`,
                },
            ],
        };
    }

    removePageFromTree(pageRef, parentPageRef, site.pages);

    await portalService.deletePage(req, pageId);
    await portalService.updateSite(site);

    let nestedPagesText = '';
    const nestedPages = getNestedPages(pageRef);
    if (nestedPages.length > 0) {
        for (const nestedPage of nestedPages) {
            await portalService.deletePage(req, nestedPage.pageId);
        }
        nestedPagesText = `Also deleted ${nestedPages.length} nested pages: ${nestedPages.map((p) => p.pageId).join(', ')}`;
    }

    return {
        content: [
            {
                type: 'text',
                text: `Page with ID "${pageId}" deleted. ${nestedPagesText}`,
            },
        ],
    };
};
