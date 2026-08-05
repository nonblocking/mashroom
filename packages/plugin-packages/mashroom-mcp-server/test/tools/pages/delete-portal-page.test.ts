import deletePortalPage from '../../../src/tools/pages/delete-portal-page';
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

const updateSiteMock = jest.fn();
const deletePageMock = jest.fn();

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
                updateSite: updateSiteMock,
                deletePage: deletePageMock,
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

describe('delete-portal-page', () => {

    beforeEach(() => {
        deletePageMock.mockClear();
        updateSiteMock.mockClear();
    });

    it('deletes a page', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await deletePortalPage(req)({
            pageId: 'page1',
        });

        expect(result.content).toEqual([
            {
                text: 'Page with ID "page1" deleted. ',
                type: 'text'
            }
        ]);

        expect(deletePageMock.mock.calls[0][1]).toBe('page1');

        expect(updateSiteMock).toHaveBeenCalledWith({
            siteId: '1',
            path: '/web',
            title: 'Default Site',
            pages: [{
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
    });

    it('deletes nested pages', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await deletePortalPage(req)({
            pageId: 'subsubpage1',
        });

        expect(result.content).toEqual([
            {
                text: 'Page with ID "subsubpage1" deleted. ',
                type: 'text'
            }
        ]);

        expect(deletePageMock.mock.calls[0][1]).toBe('subsubpage1');

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
                    en: 'Page 2',
                    de: 'Seite 2'
                },
                friendlyUrl: '/page2',
                subPages: [{
                    pageId: 'subpage1',
                    title: 'Sub Page 1',
                    friendlyUrl: '/sub1',
                    subPages: [],
                }]
            }],
        });
    });

    it('deletes all sub pages', async () => {
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await deletePortalPage(req)({
            pageId: 'page2',
        });

        expect(result.content).toEqual([
            {
                text: 'Page with ID "page2" deleted. Also deleted 2 nested pages: subpage1, subsubpage1',
                type: 'text'
            }
        ]);

        expect(deletePageMock.mock.calls[0][1]).toBe('page2');

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
            }],
        });
    });
});
