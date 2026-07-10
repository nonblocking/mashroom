import {determineServerUrl, serializeI18NString} from '../utils';
import type {
    MashroomPortalPageRef,
    MashroomPortalService
} from '@mashroom/mashroom-portal/type-definitions';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {Request} from 'express';

export default (req: Request) => async ({ siteId }: { siteId: string | undefined }): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing list-portal-pages with siteId:', siteId);

    const serverUrl = determineServerUrl(req);

    const sites = (await portalService.getSites())
        .filter((s) => !siteId || s.siteId === siteId);

    let lines: Array<string> = [];

    for (const site of sites) {
        const {path: sitePath, pages} = site;

        const allPages: Array<MashroomPortalPageRef & { fullUrl: string, parentPageId: string | null }> = [];
        const addPages = async (page: MashroomPortalPageRef, parentPageId: string | null) => {
            const fullUrl = `${serverUrl}${sitePath}${page.friendlyUrl}`;
            allPages.push({
                ...page,
                parentPageId,
                fullUrl,
            });
            if (page.subPages) {
                page.subPages.forEach((p) => addPages(p, page.pageId));
            }
        };
        pages.forEach((p) => addPages(p, null));

        const pageLines = allPages.map((p, idx) =>
            `${idx + 1}. Page ID: ${p.pageId}, Parent Page ID: ${p.parentPageId ?? '(none)'}, Friendly URL: ${p.friendlyUrl}, Full URL: ${p.fullUrl}, Title: ${serializeI18NString(p.title, pluginContext)}, Number sub pages: ${p.subPages?.length ?? 0}, Hidden: ${p.hidden ? 'yes' : 'no'}`,
        );

        lines.push(`Site "${site.siteId}" pages (${allPages.length}):\n`);
        lines.push(...pageLines);
        lines.push('\n');
    }

    return {
        content: [
            {
                type: 'text',
                text: lines.join('\n')

            }
        ]
    };
};
