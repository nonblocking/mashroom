
import listPortalSites from '../../../src/tools/sites/list-portal-sites';
import type {MashroomPortalSite} from '@mashroom/mashroom-portal/type-definitions';

const site1: MashroomPortalSite = {
    siteId: '1',
    path: '/web',
    title: {
        en: 'Default Site',
        de: 'Standard-Site',
    },
    pages: [],
};

const site2: MashroomPortalSite = {
    siteId: '2',
    path: '/second',
    defaultLayout: 'Layout 2',
    defaultTheme: 'Theme 2',
    title: 'Second Site',
    pages: [{} as any, {} as any],
};

describe('list-portal-sites', () => {

    it('returns all sites',  async () => {
        const context: any = {
            loggerFactory: () => console,
            services: {
                portal: {
                    service: {
                        getSites: async () => {
                            return [site1, site2];
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

        const result = await listPortalSites(context)();

        expect(result.content).toEqual([{
            type: 'text',
            text: `\n                    Sites (2):\n\n                    1. Site ID: 1, Base Path: /web, Title: Default Site (translations: de: Standard-Site), Number pages: 0, Default Theme: (none), Default Layout: (none)\n2. Site ID: 2, Base Path: /second, Title: Second Site, Number pages: 2, Default Theme: Theme 2, Default Layout: Layout 2\n                `,
        }]);
    });
});
