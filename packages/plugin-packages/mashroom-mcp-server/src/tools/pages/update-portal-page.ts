import {determineSiteAndPageRef, mergeToI18NString, replaceInTree} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomPortalService} from '@mashroom/mashroom-portal/type-definitions';

type Input = {
    readonly pageId: string;
    readonly newTitle?: string;
    readonly newTitleTranslations?: Record<string, string>;
    readonly newRoute?: string;
    readonly newClientSideRouting?: boolean;
    readonly newHidden?: boolean;
    readonly newLayout?: string;
    readonly newTheme?: string;
}

export default (req: Request) => async ({ pageId, newTitle, newTitleTranslations, newRoute, newClientSideRouting, newHidden, newLayout, newTheme }: Input): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing update-portal-page');

    if (newRoute && !newRoute.startsWith('/')) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: The Page route must start with a slash',
                },
            ],
        };
    }

    const { site, pageRef, parentPageRef } = await determineSiteAndPageRef(pageId, pluginContext) ?? {};
    const page = await portalService.getPage(pageId);

    if (!site || !pageRef || !page) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: No Page with ID "${pageId}" found.`,
                },
            ],
        };
    }

    const updatedItems: Array<string> = [];

    if (newTheme || newLayout) {
        // Update page
        let updatedPage = page;
        if (newTheme) {
            updatedItems.push('Theme');
            updatedPage = {...updatedPage, theme: newTheme};
        }
        if (newLayout) {
            updatedItems.push('Layout');
            updatedPage = {...updatedPage, layout: newLayout};
        }
        await portalService.updatePage(updatedPage);
    }

    if (newTitle || newTitleTranslations || newRoute || typeof newClientSideRouting === 'boolean' || typeof newHidden === 'boolean') {
        // Update page ref
        let newPageRef = pageRef;
        if (newTitle || newTitleTranslations) {
            newPageRef = { ...newPageRef, title: mergeToI18NString(pageRef.title, newTitle, newTitleTranslations, pluginContext ) };
            updatedItems.push('Title');
        }
        if (newRoute) {
            newPageRef = { ...newPageRef, friendlyUrl: newRoute };
            updatedItems.push('Route');
        }
        if (typeof newClientSideRouting === 'boolean') {
            newPageRef = { ...newPageRef, clientSideRouting: newClientSideRouting };
            updatedItems.push('Client Side Routing');
        }
        if (typeof newHidden === 'boolean') {
            newPageRef = { ...newPageRef, hidden: newHidden };
            updatedItems.push('Hidden');
        }
        const newSite = {...site};
        replaceInTree(newPageRef, parentPageRef, newSite);
        await portalService.updateSite(newSite);
    }

    return {
        content: [
            {
                type: 'text',
                text: `Page with ID "${pageId}" updated. Updated properties: ${updatedItems.join(', ')}`,
            },
        ],
    };
};
