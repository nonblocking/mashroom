
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
            text: `\n                    Mashroom Server Info:\n\n                    Server Name: Test Server\n                    Server Version: 3.0.0\n                    Default language: en\n                    Available languages: en, de\n                `,
        }]);
    });
});
