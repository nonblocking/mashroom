
import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';

export default (pluginContext: MashroomPluginContext) => async (): Promise<CallToolResult> => {
    const {serverInfo, serverConfig, services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const i18nService: MashroomI18NService = services.i18n!.service;
    const defaultLanguage = i18nService.defaultLanguage;
    const availableLanguages = i18nService.availableLanguages;

    logger.info('Executing server-info');

    return {
        content: [
            {
                type: 'text',
                text: `
                    Mashroom Server Info:

                    Server Name: ${serverConfig.name}
                    Server Version: ${serverInfo.version}
                    Default language: ${defaultLanguage}
                    Available languages: ${availableLanguages.join(', ')}
                `,
            },
        ],
    };
};
