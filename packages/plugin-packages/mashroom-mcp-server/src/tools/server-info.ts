
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
                    Mashroom Server is a Microfrontend Integration Platform.

                    Mashroom Portal is the component that can be used to build web pages consisting of multiple Microfrontends.

                    The Microfrontends can be developed in any framework and can run remotely on a different server.

                    Mashroom Portal is organized in Sites which can have multiple Pages which build a tree structure.

                    Every Page has a configurable Layout with multiple areas where Microfrontends can be placed.

                    Details about this Mashroom Server:

                    Server Name: ${serverConfig.name}
                    Server Version: ${serverInfo.version}
                    Default language: ${defaultLanguage}
                    Available languages: ${availableLanguages.join(', ')}
                `,
            },
        ],
    };
};
