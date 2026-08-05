import {randomUUID} from 'node:crypto';
import {determineServerUrl, toI18NString} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomPortalService, MashroomPortalPageRef} from '@mashroom/mashroom-portal/type-definitions';

type Input = {
    readonly siteId: string;
    readonly pageId?: string;
    readonly parentPageId?: string;
    readonly insertAfterPageId?: string;
    readonly title: string;
    readonly titleTranslations?: Record<string, string>;
    readonly description?: string;
    readonly route: string;
    readonly clientSideRouting?: boolean;
    readonly hidden?: boolean;
    readonly layout?: string;
    readonly theme?: string;
}

export default (req: Request) => async ({ siteId, pageId, parentPageId, insertAfterPageId, title, titleTranslations, description, route, clientSideRouting, hidden, layout, theme }: Input): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing add-portal-page');

    let effectivePageId = pageId;
    if (!effectivePageId) {
        effectivePageId = randomUUID();
    }

    if (!route.startsWith('/')) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: The Page route must start with a slash',
                },
            ],
        };
    }

    const site = await portalService.getSite(siteId);
    if (!site) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: No site with ID "${siteId}" found.`,
                },
            ],
        };
    }

    const i18nTitle = toI18NString(title, titleTranslations, pluginContext);
    const serverUrl = determineServerUrl(req);
    const fullPageUrl = `${serverUrl}${site.path}${route}`;

    await portalService.insertPage({
        pageId: effectivePageId,
        description,
        layout,
        theme,
    });

    const newPageRef = {
        pageId: effectivePageId,
        friendlyUrl: route,
        title: i18nTitle,
        hidden,
        clientSideRouting,
    };

    let parentPages = site.pages;
    let insertAtIndex: number = 0;

    if (parentPageId) {
        const findParentPage = (pageRefs: Array<MashroomPortalPageRef>) => {
            for (const pageRef of pageRefs) {
                if (pageRef.pageId === parentPageId) {
                    if (!pageRef.subPages) {
                        (pageRef as any).subPages = [];
                    }
                    parentPages = pageRef.subPages!;
                }
            }
        };
        findParentPage(site.pages);
    }
    if (insertAfterPageId) {
        for (let i = 0; i < parentPages.length; i++) {
            if (parentPages[i].pageId === insertAfterPageId) {
                insertAtIndex = i + 1;
                break;
            }
        }
    }

    parentPages.splice(insertAtIndex, 0, newPageRef);

    await portalService.updateSite(site);

    return {
        content: [
            {
                type: 'text',
                text: `New page created with ID "${effectivePageId}". Page URL: ${fullPageUrl}`,
            },
        ],
    };
};
