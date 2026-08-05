import updatePortalPage from '../../../src/tools/pages/update-portal-page';
import type {MashroomPortalSite} from '@mashroom/mashroom-portal/type-definitions';

const createSite1: () => MashroomPortalSite = () => ({
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
        }]
    }],
});

const createPage = () => ({
    pageId: 'test-page-id',
    description: 'This is a new page',
    layout: 'Layout 1',
    theme: 'Theme 1',
    hidden: false,
});

const updateSiteMock = jest.fn();
const updatePageMock = jest.fn();

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
                    return [createSite1()];
                },
                getPage: async () => {
                    return createPage();
                },
                updateSite: updateSiteMock,
                updatePage: updatePageMock,
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

describe('update-portal-page', () => {

    beforeEach(() => {
        updatePageMock.mockClear();
        updateSiteMock.mockClear();
    });

    it('updates page properties', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await updatePortalPage(req)({
            pageId: 'page2',
            newTheme: 'Theme 2',
            newLayout: 'Layout 2',
        });

        expect(result.content).toEqual([
            {
                text: 'Page with ID "page2" updated. Updated properties: Theme, Layout',
                type: 'text'
            }
        ]);

        expect(updatePageMock).toHaveBeenCalledWith({
            description: 'This is a new page',
            hidden: false,
            layout: 'Layout 2',
            pageId: 'test-page-id',
            theme: 'Theme 2',
        });

        expect(updateSiteMock).not.toHaveBeenCalled();
    });


    it('updates page reference properties', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await updatePortalPage(req)({
            pageId: 'page2',
            newTitle: 'New Page 2',
            newTitleTranslations: {
                de: 'Neue Seite 2',
            },
            newRoute: '/new-page123',
            newHidden: true,
        });

        expect(result.content).toEqual([
            {
                text: 'Page with ID "page2" updated. Updated properties: Title, Route, Hidden',
                type: 'text'
            }
        ]);

        expect(updatePageMock).not.toHaveBeenCalled();

        expect(updateSiteMock).toHaveBeenCalledWith({
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
                    de: 'Neue Seite 2',
                    en: 'New Page 2',
                },
                friendlyUrl: '/new-page123',
                hidden: true,
                subPages: [{
                    pageId: 'subpage1',
                    title: 'Sub Page 1',
                    friendlyUrl: '/sub1',
                    subPages: [{
                        pageId: 'subsubpage1',
                        title: 'Another nested page',
                        friendlyUrl: '/subsub1',
                    }],
                }]
            }],
        });
    });

    it('updates nested pages', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await updatePortalPage(req)({
            pageId: 'subsubpage1',
            newRoute: '/new-page123',
            newClientSideRouting: true,
        });

        expect(result.content).toEqual([
            {
                text: 'Page with ID "subsubpage1" updated. Updated properties: Route, Client Side Routing',
                type: 'text'
            }
        ]);

        expect(updatePageMock).not.toHaveBeenCalled();

        expect(updateSiteMock).toHaveBeenCalledWith({
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
                        de: 'Seite 2',
                             en: 'Page 2',
                },
                friendlyUrl: '/page2',
                subPages: [{
                    pageId: 'subpage1',
                    title: 'Sub Page 1',
                    friendlyUrl: '/sub1',
                    subPages: [{
                        pageId: 'subsubpage1',
                        clientSideRouting: true,
                        title: 'Another nested page',
                        friendlyUrl: '/new-page123',
                    }],
                }]
            }],
        });
    });
});
