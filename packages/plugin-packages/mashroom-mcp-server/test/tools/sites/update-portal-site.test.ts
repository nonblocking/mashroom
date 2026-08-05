import updatePortalSite from '../../../src/tools/sites/update-portal-site';
import type {MashroomPortalSite} from '@mashroom/mashroom-portal/type-definitions';

const createSite1: () => MashroomPortalSite = () => ({
    siteId: '1',
    path: '/web',
    title: 'Default Site',
    pages: [{
        friendlyUrl: '/new-page123',
        pageId: 'test-page-id',
        title: {
            de: 'Neue Seite',
            en: 'New Page'
        }
    },
        {
            friendlyUrl: '/page1',
            pageId: 'page1',
            title: {
                de: 'Seite 1',
                en: 'Page 1'
            }
        }],
});

const updateSiteMock = jest.fn();

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
                getSite: async () => {
                    return createSite1();
                },
                updateSite: updateSiteMock,
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

describe('update-portal-site', () => {

    beforeEach(() => {
        updateSiteMock.mockClear();
    });

    it('updates page properties', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await updatePortalSite(req)({
            siteId: '1',
            newTitle: 'New Site 2',
            newTitleTranslations: {
                de: 'Neue Site 2',
            },
            newPath: '/foo',
            newDefaultTheme: 'Theme 2',
            newDefaultLayout: 'Layout 2',
        });

        expect(result.content).toEqual([
            {
                text: 'Site with ID "1" updated. Updated properties: Title, Path, Default Layout, Default Theme',
                type: 'text'
            }
        ]);

        expect(updateSiteMock).toHaveBeenCalledWith({
            siteId: '1',
            path: '/foo',
            defaultLayout: 'Layout 2',
            defaultTheme: 'Theme 2',
            title: {
                de: 'Neue Site 2',
                en: 'New Site 2',
            },
            pages: [{
                friendlyUrl: '/new-page123',
                pageId: 'test-page-id',
                title: {
                    de: 'Neue Seite',
                    en: 'New Page'
                }
            },
                {
                    friendlyUrl: '/page1',
                    pageId: 'page1',
                    title: {
                        de: 'Seite 1',
                        en: 'Page 1'
                    }
                }],
        });
    });

});
