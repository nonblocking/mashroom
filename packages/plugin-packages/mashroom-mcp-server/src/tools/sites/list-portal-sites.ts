import {determineServerUrl, serializeI18NString} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomPortalService} from '@mashroom/mashroom-portal/type-definitions';

export default (req: Request) => async (): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing list-portal-sites');

    const sites = await portalService.getSites();
    const serverUrl = determineServerUrl(req);

    const lines = sites.map((s, idx) => {
        const fullUrl = `${serverUrl}${s.path}`;
        return `${idx + 1}. Site ID: ${s.siteId}, Path: ${s.path}, Full URL: ${fullUrl}, Title: ${serializeI18NString(s.title, pluginContext)}, Number pages: ${s.pages.length}, Default Theme: ${s.defaultTheme ?? '(none)'}, Default Layout: ${s.defaultLayout ?? '(none)'}`;
    });

    return {
        content: [
            {
                type: 'text',
                text: `
Sites (${sites.length}):

${lines.join('\n')}
                `,
            },
        ],
    };
};
