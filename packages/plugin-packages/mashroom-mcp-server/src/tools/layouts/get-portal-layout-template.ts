import {getLayoutTemplate} from '../utils';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';

export default (req: Request) => async ({ layoutName }: { layoutName: string }): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');

    logger.info('Executing get-portal-layout-template');

    const layoutTemplate = await getLayoutTemplate(layoutName, pluginContext);

    if (!layoutTemplate) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: No layout template found for layout "${layoutName}"`,
                },
            ],
        };
    }

    return {
        content: [
            {
                type: 'text',
                text: `
Portal Layout "${layoutName}":

${layoutTemplate}
                `,
            },
        ],
    };
};
