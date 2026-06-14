import {serializeI18NString} from '../utils';
import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalPageRef,
    MashroomPortalService
} from '@mashroom/mashroom-portal/type-definitions';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';

export default (pluginContext: MashroomPluginContext) => async ({ siteId }: { siteId: string }): Promise<CallToolResult> => {
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing list-portal-site-pages with siteId:', siteId);

    const site = await portalService.getSite(siteId);
    if (!site) {
        return {
            content: [
                {
                    type: 'text',
                    text: `No site with ID "${siteId}" found.`,
                },
            ],
        };
    }
    const {path, pages} = site;

    const allPages: Array<MashroomPortalPageRef & { fullUrl: string, parentPageId: string | null }> = [];
    const addPages = async (page: MashroomPortalPageRef, parentPageId: string | null, parentPath: string) => {
        const fullUrl = `${parentPath}${page.friendlyUrl}`;
        allPages.push({
            ...page,
            parentPageId,
            fullUrl,
        });
        if (page.subPages) {
            page.subPages.forEach((p) => addPages(p, page.pageId, fullUrl));
        }
    };
    pages.forEach((p) => addPages(p, null, path));

    const lines = allPages.map((p, idx) =>
        `${idx + 1}. Page ID: ${p.pageId}, Parent Page ID: ${p.parentPageId ?? '(none)'}, Friendly URL: ${p.friendlyUrl}, Full URL: ${p.fullUrl}, Title: ${serializeI18NString(p.title, pluginContext)}, Number sub pages: ${p.subPages?.length ?? 0}, Hidden: ${p.hidden ? 'yes' : 'no'}`,
    );

    return {
        content: [
            {
                type: 'text',
                text: `
                    Site "${siteId}" pages:

                    ${lines.join('\n')}
                `,
            }
        ]
    };
};
