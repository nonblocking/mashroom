import {serializeI18NString} from '../utils';
import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomPortalService} from '@mashroom/mashroom-portal/type-definitions';

export default (pluginContext: MashroomPluginContext) => async (): Promise<CallToolResult> => {
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const portalService = services.portal!.service as MashroomPortalService;

    logger.info('Executing list-portal-sites');

    const sites = await portalService.getSites();

    const lines = sites.map((s, idx) =>
       `${idx + 1}. Site ID: ${s.siteId}, Base Path: ${s.path}, Title: ${serializeI18NString(s.title, pluginContext)}, Number pages: ${s.pages.length}, Default Theme: ${s.defaultTheme ?? '(none)'}, Default Layout: ${s.defaultLayout ?? '(none)'}`,
    );

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
