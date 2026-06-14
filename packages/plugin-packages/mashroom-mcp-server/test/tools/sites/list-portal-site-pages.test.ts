
import listPortalSitePages from '../../../src/tools/sites/list-portal-site-pages';
import type {MashroomPortalSite} from '@mashroom/mashroom-portal/type-definitions';

const site1: MashroomPortalSite = {
    siteId: '1',
    path: '/web',
    title: 'Default Site',
    pages: [{
        pageId: 'page1',
        title: {
            en: 'Page 1',
            de: 'Seite 1'
        },
        friendlyUrl: '/page1',
    }, {
        pageId: 'page2',
        title: {
            en: 'Page 2',
            de: 'Seite 2'
        },
        friendlyUrl: '/page2',
        subPages: [{
            pageId: 'subpage1',
            title: 'Sub Page 1',
            friendlyUrl: '/sub1',
            subPages: [{
                pageId: 'subsubpage1',
                title: 'Another nested page',
                friendlyUrl: '/subsub1',
            }],
        }, {
            pageId: 'subpage1',
            title: 'Hidden Sub Page 1',
            friendlyUrl: '/sub2',
            hidden: true,
        }]
    }],
};


describe('list-portal-site-pages', () => {

    it('returns all sites',  async () => {
        const context: any = {
            loggerFactory: () => console,
            services: {
                portal: {
                    service: {
                        getSite: async () => {
                            return site1;
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

        const result = await listPortalSitePages(context)({ siteId: '1'});

        expect(result.content).toEqual([{
            type: 'text',
            text: `\n                    Site "1" pages:\n\n                    1. Page ID: page1, Parent Page ID: (none), Friendly URL: /page1, Full URL: /web/page1, Title: Page 1 (translations: de: Seite 1), Number sub pages: 0, Hidden: no\n2. Page ID: page2, Parent Page ID: (none), Friendly URL: /page2, Full URL: /web/page2, Title: Page 2 (translations: de: Seite 2), Number sub pages: 2, Hidden: no\n3. Page ID: subpage1, Parent Page ID: page2, Friendly URL: /sub1, Full URL: /web/page2/sub1, Title: Sub Page 1, Number sub pages: 1, Hidden: no\n4. Page ID: subsubpage1, Parent Page ID: subpage1, Friendly URL: /subsub1, Full URL: /web/page2/sub1/subsub1, Title: Another nested page, Number sub pages: 0, Hidden: no\n5. Page ID: subpage1, Parent Page ID: page2, Friendly URL: /sub2, Full URL: /web/page2/sub2, Title: Hidden Sub Page 1, Number sub pages: 0, Hidden: yes\n                `,
        }]);
    });
});
