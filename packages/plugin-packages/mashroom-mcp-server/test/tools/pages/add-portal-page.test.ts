import addPortalPage from '../../../src/tools/pages/add-portal-page';
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
        }, {
            pageId: 'subpage1',
            title: 'Hidden Sub Page 1',
            friendlyUrl: '/sub2',
            hidden: true,
        }]
    }],
});

const updateSiteMock = jest.fn();
const insertPageMock = jest.fn();

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
                insertPage: insertPageMock,
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

describe('add-portal-page', () => {

    beforeEach(() => {
        insertPageMock.mockClear();
        updateSiteMock.mockClear();
    });

    it('adds a new page at the end', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await addPortalPage(req)({
            siteId: '1',
            pageId: 'test-page-id',
            title: 'New Page',
            titleTranslations: {
                de: 'Neue Seite',
            },
            route: '/new-page123',
            layout: 'Layout 1',
            theme: 'Theme 1',
            description: 'This is a new page',
        });

        expect(result.content).toEqual([
            {
                text: 'New page created with ID "test-page-id". Page URL: http://localhost:1234/portal/web/new-page123',
                type: 'text'
            }
        ]);

        expect(insertPageMock).toHaveBeenCalledWith({
            pageId: 'test-page-id',
            description: 'This is a new page',
            layout: 'Layout 1',
            theme: 'Theme 1',
        });

        expect(updateSiteMock).toHaveBeenCalledWith({
            pages: [
                {
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
                },
                {
                    friendlyUrl: '/page2',
                    pageId: 'page2',
                    subPages: [
                        {
                            friendlyUrl: '/sub1',
                            pageId: 'subpage1',
                            subPages: [
                                {
                                    friendlyUrl: '/subsub1',
                                    pageId: 'subsubpage1',
                                    title: 'Another nested page'
                                }
                            ],
                            title: 'Sub Page 1'
                        },
                        {
                            friendlyUrl: '/sub2',
                            hidden: true,
                            pageId: 'subpage1',
                            title: 'Hidden Sub Page 1'
                        }
                    ],
                    title: {
                        de: 'Seite 2',
                        en: 'Page 2'
                    }
                },
            ],
            path: '/web',
            siteId: '1',
            title: 'Default Site'
        });
    });

    it('adds a page after given page', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        await addPortalPage(req)({
            siteId: '1',
            pageId: 'test-page-id2',
            insertAfterPageId: 'page2',
            title: 'New Page',
            titleTranslations: {
                de: 'Neue Seite',
            },
            route: '/new-page123',
            layout: 'Layout 1',
            theme: 'Theme 1',
            description: 'This is a new page',
        });

        expect(updateSiteMock).toHaveBeenCalledWith({
            pages: [
                {
                    friendlyUrl: '/page1',
                    pageId: 'page1',
                    title: {
                        de: 'Seite 1',
                        en: 'Page 1'
                    }
                },
                {
                    friendlyUrl: '/page2',
                    pageId: 'page2',
                    subPages: [
                        {
                            friendlyUrl: '/sub1',
                            pageId: 'subpage1',
                            subPages: [
                                {
                                    friendlyUrl: '/subsub1',
                                    pageId: 'subsubpage1',
                                    title: 'Another nested page'
                                }
                            ],
                            title: 'Sub Page 1'
                        },
                        {
                            friendlyUrl: '/sub2',
                            hidden: true,
                            pageId: 'subpage1',
                            title: 'Hidden Sub Page 1'
                        }
                    ],
                    title: {
                        de: 'Seite 2',
                        en: 'Page 2'
                    }
                },
                {
                    friendlyUrl: '/new-page123',
                    pageId: 'test-page-id2',
                    title: {
                        de: 'Neue Seite',
                        en: 'New Page'
                    }
                }
            ],
            path: '/web',
            siteId: '1',
            title: 'Default Site'
        });
    });

    it('adds a page after after a specific page', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        await addPortalPage(req)({
            siteId: '1',
            pageId: 'test-page-id3',
            parentPageId: 'page2',
            insertAfterPageId: 'subpage1',
            title: 'New Page',
            titleTranslations: {
                de: 'Neue Seite',
            },
            route: '/new-page123',
            layout: 'Layout 1',
            theme: 'Theme 1',
            description: 'This is a new page',
        });

        expect(updateSiteMock).toHaveBeenCalledWith({
            pages: [
                {
                    friendlyUrl: '/page1',
                    pageId: 'page1',
                    title: {
                        de: 'Seite 1',
                        en: 'Page 1'
                    }
                },
                {
                    friendlyUrl: '/page2',
                    pageId: 'page2',
                    subPages: [
                        {
                            friendlyUrl: '/sub1',
                            pageId: 'subpage1',
                            subPages: [
                                {
                                    friendlyUrl: '/subsub1',
                                    pageId: 'subsubpage1',
                                    title: 'Another nested page'
                                }
                            ],
                            title: 'Sub Page 1'
                        },
                        {
                            friendlyUrl: '/new-page123',
                            pageId: 'test-page-id3',
                            title: {
                                de: 'Neue Seite',
                                en: 'New Page'
                            }
                        },
                        {
                            friendlyUrl: '/sub2',
                            hidden: true,
                            pageId: 'subpage1',
                            title: 'Hidden Sub Page 1'
                        }
                    ],
                    title: {
                        de: 'Seite 2',
                        en: 'Page 2'
                    }
                }
            ],
            path: '/web',
            siteId: '1',
            title: 'Default Site'
        });
    });
});
