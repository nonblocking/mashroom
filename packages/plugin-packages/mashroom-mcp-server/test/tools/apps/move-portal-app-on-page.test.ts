import movePortalAppOnPage from '../../../src/tools/apps/move-portal-app-on-page';
import type {MashroomPortalApp, MashroomPortalPage} from '@mashroom/mashroom-portal/type-definitions';

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
        }, {
            pluginName: 'My App 2',
            instanceId: '123',
        }],
    }
};

const app1: Partial<MashroomPortalApp> = {
    name: 'My App 2',
    defaultAppConfig: {
        message: 'The actual message',
    },
};

const mockUpdatePage = jest.fn();

describe('remove-portal-app-from-page', () => {

    it('successfully removes a Portal App from a page',  async () => {
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                portal: {
                    service: {
                        getPage: async () => {
                            return page1;
                        },
                        getPortalApps: () => [app1],
                        updatePage: mockUpdatePage,
                    }
                },
                security: {
                    service: {
                        updateResourcePermission: () => Promise.resolve(),
                    }
                }
            }
        };
        const req: any = { pluginContext };

        const result = await movePortalAppOnPage(req)({
            appName: 'My App 2',
            appInstanceId: '123',
            pageId: '1',
            newAreaId: 'area1',
            newPosition: 1,
        });

        expect(result.content).toEqual([{
            type: 'text',
            text: `Success: Portal App "My App 2" with Instance ID 123 moved to position 1 in area "area1"`,
        }]);

        expect(mockUpdatePage).toHaveBeenCalledWith({
            pageId: '1',
            portalApps: {
                area1: [{
                    pluginName: 'App 1',
                    instanceId: '22',
                },  {
                    pluginName: 'My App 2',
                    instanceId: '123',
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
    });
});
