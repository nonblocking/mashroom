import {resolve} from 'path';
import listPortalLayouts from '../../../src/tools/layouts/list-portal-layouts';
import type {MashroomPlugin} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalLayout} from '@mashroom/mashroom-portal/type-definitions';

const plugin1: Partial<MashroomPlugin> = {
    name: 'Mashroom Portal Default Layouts',
    type: 'portal-layouts',
    pluginDefinition: {
        name: 'Mashroom Portal Default Layouts',
        type: 'portal-layouts',
        layouts: {
            '1 Column': './layouts/1column.html',
            '2 Columns': './layouts/2columns.html',
            '2 Columns 70/30': './layouts/2columns-70-30.html',
            '2 Columns with 1 Column Header': './layouts/2columnsWith1columnHeader.html'
        }
    },
};

const layout: Partial<MashroomPortalLayout> = {
    name: 'Mashroom Portal Default Layouts',
    layoutId: '1 Column',
    layoutPath: resolve(__dirname, '../../data', 'test_layout.html'),
};

describe('list-portal-layouts', () => {

    it('returns all known layouts',  async () => {
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                core: {
                    pluginService: {
                        getPlugins: () => {
                            return [plugin1];
                        },
                    }
                },
                portal: {
                    service: {
                        getLayouts: () => {
                            return [layout];
                        }
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

        const result = await listPortalLayouts(req)();

        expect(result.content).toEqual([{
            type: 'text',
            text: `\nPortal Layouts (4):\n\n1. Layout Name: "1 Column", Layout Area IDs: app-area1, app-area2, Plugin Name: "Mashroom Portal Default Layouts", Plugin Description: "-"\n2. Layout Name: "2 Columns", Layout Area IDs: , Plugin Name: "Mashroom Portal Default Layouts", Plugin Description: "-"\n3. Layout Name: "2 Columns 70/30", Layout Area IDs: , Plugin Name: "Mashroom Portal Default Layouts", Plugin Description: "-"\n4. Layout Name: "2 Columns with 1 Column Header", Layout Area IDs: , Plugin Name: "Mashroom Portal Default Layouts", Plugin Description: "-"\n                `,
        }]);
    });
});
