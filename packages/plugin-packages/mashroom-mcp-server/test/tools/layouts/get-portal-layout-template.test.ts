import {resolve} from 'path';
import getPortalLayoutTemplate from '../../../src/tools/layouts/get-portal-layout-template';
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

describe('get-portal-layout-template', () => {

    it('returns the template',  async () => {
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

        const result = await getPortalLayoutTemplate(req)({ layoutName: '1 Column' });

        expect(result.content).toEqual([{
            type: 'text',
            text: `\nPortal Layout "1 Column":\n\n<div class="row">\n    <div class="mashroom-portal-app-area col-lg-6" id="app-area1">\n        <!-- Portal Apps go here -->\n    </div>\n    <div class="mashroom-portal-app-area col-lg-6" id="app-area2">\n        <!-- Portal Apps go here -->\n    </div>\n</div>\n\n                `,
        }]);
    });
});
