import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';

export default (req: Request) => async (): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const pluginService = services.core.pluginService;

    logger.info('Executing list-portal-themes');

    const portalThemes = pluginService.getPlugins()
        .filter((p) => p.type === 'portal-theme');

    const lines = portalThemes.map((ot, idx) => {
        const {name, description} = ot;
        return `${idx + 1}. Name: "${name}", Description: "${description ?? '-'}"`;
    });

    return {
        content: [
            {
                type: 'text',
                text: `
Portal Themes (${lines.length}):

${lines.join('\n')}
                `,
            },
        ],
    };
};
