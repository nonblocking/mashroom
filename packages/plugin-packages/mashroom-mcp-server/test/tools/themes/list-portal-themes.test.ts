import listPortalThemes from '../../../src/tools/themes/list-portal-themes';
import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';

const plugin1: Partial<MashroomPlugin> = {
    name: 'Mashroom Portal Bootstrap Theme',
    type: 'portal-theme',
    pluginDefinition: {
        name: 'Mashroom Portal Bootstrap Theme',
        type: 'portal-theme',
    },
};

const plugin2: Partial<MashroomPlugin> = {
    name: 'My Custom Theme',
    type: 'portal-theme',
    pluginDefinition: {
        name: 'My Custom Theme',
        type: 'portal-theme',
    },
};

describe('list-portal-themes', () => {

    it('returns all known themes',  async () => {
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                core: {
                    pluginService: {
                        getPlugins: () => {
                            return [plugin1, plugin2];
                        },
                    }
                },
                i18n: {
                    service: {
                        defaultLanguage: 'en',
                        availableLanguages: ['en', 'de'],
                    }
                }
            }
        };
        const req: any = { pluginContext };

        const result = await listPortalThemes(req)();

        expect(result.content).toEqual([{
            type: 'text',
            text: `\nPortal Themes (2):\n\n1. Name: "Mashroom Portal Bootstrap Theme", Description: "-"\n2. Name: "My Custom Theme", Description: "-"\n                `,
        }]);
    });
});
