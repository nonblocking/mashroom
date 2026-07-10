import addPortalAppToPage from '../../../src/tools/apps/add-portal-app-to-page';
import type {
    MashroomPortalApp,
    MashroomPortalPage,
    MashroomPortalSite
} from '@mashroom/mashroom-portal/type-definitions';

const site1: MashroomPortalSite = {
    siteId: '1',
    path: '/web',
    title: 'Default Site',
    pages: [{
        pageId: '1',
        title: {
            en: 'Page 1',
            de: 'Seite 1'
        },
        friendlyUrl: '/page1',
    }],
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

const app1: Partial<MashroomPortalApp> = {
    name: 'My App 2',
    defaultAppConfig: {
        message: 'The actual message',
    },
};

const mockUpdatePage = jest.fn();
const mockInsertPortalAppInstance = jest.fn();

describe('add-portal-app-to-page', () => {

    it('successfully adds a Portal App',  async () => {
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
                        getPage: async () => {
                            return page1;
                        },
                        getSites: async () => {
                            return [site1];
                        },
                        getPortalApps: () => [app1],
                        findPageRefByPageId: async () => {
                            return pageRef;
                        },
                        updatePage: mockUpdatePage,
                        insertPortalAppInstance: mockInsertPortalAppInstance,
                    }
                },
                security: {
                    service: {
                        updateResourcePermission: () => Promise.resolve(),
                    }
                }
            }
        };
        const req: any = {
            host: 'localhost:1234',
            headers: {},
            pluginContext,
        };

        const result = await addPortalAppToPage(req)({
            appName: 'My App 2',
            pageId: '123',
            areaId: 'area1',
            overrideAppConfig: {
                foo: 'bar',
            },
        });

        expect((result.content[0] as any).text).toContain('Success: Portal App "My App 2" added to page "123" at position 0 in area "area1. App Instance ID:');
        expect((result.content[0] as any).text).toContain('Full page URL: http://localhost:1234/portal/web/page1');

        expect(mockUpdatePage).toHaveBeenCalled();
        const instanceId = mockUpdatePage.mock.calls[0][0].portalApps.area1[0].instanceId;
        expect(mockUpdatePage).toHaveBeenCalledWith({
            pageId: '1',
            portalApps: {
                area1: [{
                    instanceId,
                   pluginName: 'My App 2',
                }, {
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
        });
        expect(mockInsertPortalAppInstance).toHaveBeenCalledWith({
            appConfig: {
                message: 'The actual message',
                foo: 'bar',
            },
            instanceId,
            pluginName: 'My App 2',
        });
    });
});
