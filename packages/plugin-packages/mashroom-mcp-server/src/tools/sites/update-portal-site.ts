import {mergeToI18NString} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomPortalService} from '@mashroom/mashroom-portal/type-definitions';

type Input = {
    readonly siteId: string;
    readonly newTitle?: string;
    readonly newTitleTranslations?: Record<string, string>;
    readonly newPath?: string;
    readonly newDefaultLayout?: string;
    readonly newDefaultTheme?: string;
}

export default (req: Request) => async ({ siteId, newTitle, newTitleTranslations, newPath, newDefaultLayout, newDefaultTheme }: Input): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing update-portal-site');

    if (newPath) {
        if (!newPath.startsWith('/')) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Error: The Site path must start with a slash',
                    },
                ],
            };
        }
        if (newPath.indexOf('/', 1) !== -1) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Error: The Site path must not contain a slash except the one at the beginning',
                    },
                ],
            };
        }
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

    const updatedItems: Array<string> = [];

    let newSite = site;
    if (newTitle || newTitleTranslations) {
        if (newTitle || newTitleTranslations) {
            newSite = { ...newSite, title: mergeToI18NString(site.title, newTitle, newTitleTranslations, pluginContext ) };
            updatedItems.push('Title');
        }
    }
    if (newPath) {
        newSite = { ...newSite, path: newPath };
        updatedItems.push('Path');
    }
    if (newDefaultLayout) {
        newSite = { ...newSite, defaultLayout: newDefaultLayout };
        updatedItems.push('Default Layout');
    }
    if (newDefaultTheme) {
        newSite = { ...newSite, defaultTheme: newDefaultTheme };
        updatedItems.push('Default Theme');
    }

    await portalService.updateSite(newSite);

    return {
        content: [
            {
                type: 'text',
                text: `Site with ID "${siteId}" updated. Updated properties: ${updatedItems.join(', ')}`,
            },
        ],
    };
};
