import {serializeI18NString} from '../utils';
import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';

export default (pluginContext: MashroomPluginContext) => async (): Promise<CallToolResult> => {
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const pluginService = services.core.pluginService;

    logger.info('Executing list-registered-portal-apps');

    const apps = pluginService.getPlugins()
        .filter((p) => p.type === 'portal-app2' || p.type === 'portal-app');
    const pluginPackages = pluginService.getPotentialPluginPackages();

    const lines = apps.map((a, idx) => {
        const {config, type, pluginDefinition} = a;
        const {defaultConfig} = a.pluginDefinition;
        const fullConfig = {...defaultConfig, ...config};
        const version = type === 'portal-app2' ? 2 : 1;
        const title = version === 2 ? fullConfig.title : pluginDefinition.title;
        const category = version === 2 ? fullConfig.category : pluginDefinition.category;
        const description = fullConfig.description || pluginDefinition.description;
        let source = a.pluginPackage.pluginPackageUrl.toString();
        if (pluginPackages.find((pp) => pp.url.toString() === source)?.scannerName === 'Mashroom Remote Package Scanner Kubernetes') {
            source += ' (Kubernetes)';
        }

        return `${idx + 1}. Name: ${a.name}, Title: ${serializeI18NString(title, pluginContext)}, Description: ${serializeI18NString(description, pluginContext)}, Category: ${category}, Source: ${source}, Status: ${a.status}, config: ${JSON.stringify(fullConfig)}`;
    });

    return {
        content: [
            {
                type: 'text',
                text: `
                    Registered Portal Apps (${lines.length}):

                    ${lines.join('\n')}
                `,
            },
        ],
    };
};
