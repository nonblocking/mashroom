
import {resolve} from 'path';
import portalPageDetails from '../../../src/tools/pages/portal-page-details';
import type {
    MashroomPortalLayout,
    MashroomPortalPage,
    MashroomPortalSite
} from '@mashroom/mashroom-portal/type-definitions';

const site1: MashroomPortalSite = {
    siteId: '1',
    path: '/web',
    defaultLayout: 'Layout 2',
    title: {
        en: 'Default Site',
        de: 'Standard-Site',
    },
    pages: [],
};

const page1: MashroomPortalPage = {
    pageId: '1',
    portalApps: {
        area1: [{
           pluginName: 'App 1',
            instanceId: '22',
        }, {
            pluginName: 'App 2',
            instanceId: '3',
        }],
        area2: [{
            pluginName: 'App 55',
            instanceId: '123123123',
        }],
    }
};

const pageRef = {
    pageId: 'page1',
    title: {
        en: 'Page 1',
        de: 'Seite 1'
    },
    friendlyUrl: '/page1',
};

const layout: Partial<MashroomPortalLayout> = {
    name: 'Layout 2',
    layoutPath: resolve(__dirname, '../../data', 'test_layout.html'),
};

describe('portal-page-details', () => {

    it('returns the page details',  async () => {
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                core: {
                    pluginService: {
                        getPlugins: () => {
                            return [];
                        },
                    }
                },
                portal: {
                    service: {
                        getSites: async () => {
                            return [site1];
                        },
                        getPage: async () => {
                            return page1;
                        },
                        findPageRefByPageId: async () => {
                            return pageRef;
                        },
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

        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await portalPageDetails(req)({ pageId: '1'});

        expect(result.content).toEqual([{
            type: 'text',
            text: `\nPage "1" Details:\n\nTitle: Page 1 (Translations: de: Seite 1)\nDescription: undefined\nFriendlyUrl: /page1\nFull URL: http://localhost:1234/portal/web/page1\nLayout: Layout 2\nLayout Area IDs: app-area1, app-area2\nApps on the Page:\n    1. Name: App 1, Instance ID: 22, Area ID: area1\n1. Name: App 2, Instance ID: 3, Area ID: area1\n2. Name: App 55, Instance ID: 123123123, Area ID: area2\n                `,
        }]);
    });
});
