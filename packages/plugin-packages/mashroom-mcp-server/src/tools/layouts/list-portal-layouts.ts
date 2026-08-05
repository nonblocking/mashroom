import {determineLayoutAreaIds} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';

export default (req: Request) => async (): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const pluginService = services.core.pluginService;

    logger.info('Executing list-portal-layouts');

    const layoutPlugins = pluginService.getPlugins()
        .filter((p) => p.type === 'portal-layouts');

    let count = 0;
    const lines: Array<string> = [];

    for (const lp of layoutPlugins) {
        const {name, description, pluginDefinition: { layouts = {} }} = lp;
        for (const layoutName of Object.keys(layouts)) {
            count ++;
            const layoutAreaIds = await determineLayoutAreaIds(layoutName, pluginContext);
            lines.push( `${count}. Layout Name: "${layoutName}", Layout Area IDs: ${layoutAreaIds.join(', ')}, Plugin Name: "${name}", Plugin Description: "${description ?? '-'}"`);
        }
    }

    return {
        content: [
            {
                type: 'text',
                text: `
Portal Layouts (${lines.length}):

${lines.join('\n')}
                `,
            },
        ],
    };
};
