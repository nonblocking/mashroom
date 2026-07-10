
import serverInfo from '../../src/tools/server-info';

describe('server-info', () => {

    it('returns the server info',  async () => {
        const context: any = {
            serverInfo: {
              version: '3.0.0',
            },
            serverConfig: {
                name: 'Test Server',
            },
            loggerFactory: () => console,
            services: {
                i18n: {
                    service: {
                        defaultLanguage: 'en',
                        availableLanguages: ['en', 'de'],
                    }
                }
            }
        };

        const result = await serverInfo(context)();

        expect(result.content).toEqual([{
            type: 'text',
            text: '\n                    Mashroom Server is a Microfrontend Integration Platform.\n\n                    Mashroom Portal is the component that can be used to build web pages consisting of multiple Microfrontends.\n\n                    The Microfrontends can be developed in any framework and can run remotely on a different server.\n\n                    Mashroom Portal is organized in Sites which can have multiple Pages which build a tree structure.\n\n                    Every Page has a configurable Layout with multiple areas where Microfrontends can be placed.\n\n                    Details about this Mashroom Server:\n\n                    Server Name: Test Server\n                    Server Version: 3.0.0\n                    Default language: en\n                    Available languages: en, de\n                ',
        }]);
    });
});
