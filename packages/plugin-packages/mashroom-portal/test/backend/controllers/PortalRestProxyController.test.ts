
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import PortalRestProxyController from '../../../src/backend/controllers/PortalRestProxyController';
import type {MashroomPortalApp} from '../../../type-definitions';

const portalConfig: any = {
    path: '/portal',
};
setPortalPluginConfig(portalConfig);

const httpProxyServiceForwardMock = jest.fn();

const portalApp1: MashroomPortalApp = {
    name: 'Test Portal App 1',
    title: null,
    description: null,
    tags: [],
    version: '1.0',
    homepage: null,
    author: null,
    license: null,
    category: null,
    metaInfo: null,
    lastReloadTs: 222222222,
    globalLaunchFunction: 'foo',
    resourcesRootUri: `file://${__dirname}`,
    resources: {
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: null,
    screenshots: null,
    defaultRestrictViewToRoles: null,
    rolePermissions: null,
    restProxies: {
        'my-proxy': {
            targetUri: 'https://www.mashroom-server.com/api',
        },
    },
    defaultAppConfig: {
        hello: 'world',
        foo: 'bar',
    },
};

const portalApp2: MashroomPortalApp = {
    name: 'Test Portal App 2',
    title: null,
    description: null,
    tags: [],
    version: '1.0',
    homepage: null,
    author: null,
    license: null,
    category: null,
    metaInfo: null,
    lastReloadTs: 222222222,
    globalLaunchFunction: 'foo',
    resourcesRootUri: `file://${__dirname}`,
    resources: {
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: null,
    screenshots: null,
    defaultRestrictViewToRoles: null,
    rolePermissions: {
        'edit': ['Role2'],
        'delete': ['Administrator']
    },
    restProxies: {
        'my-proxy': {
            targetUri: 'https://www.mashroom-server.com/api',
            sendUserHeaders: true,
            sendPermissionsHeader: true,
            addHeaders: {
                'X-EXTRA': 'test',
            },
        },
    },
    defaultAppConfig: {
        hello: 'world',
        foo: 'bar',
    },
};

const portalApp3: MashroomPortalApp = {
    name: 'Test Portal App 3',
    title: null,
    description: null,
    tags: [],
    version: '1.0',
    homepage: null,
    author: null,
    license: null,
    category: null,
    metaInfo: null,
    lastReloadTs: 222222222,
    globalLaunchFunction: 'foo',
    resourcesRootUri: `file://${__dirname}`,
    resources: {
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: null,
    screenshots: null,
    defaultRestrictViewToRoles: null,
    rolePermissions: {},
    restProxies: {
        'my-proxy': {
            targetUri: 'https://www.mashroom-server.com/api',
            restrictToRoles: ['Role5'],
        },
    },
    defaultAppConfig: {},
};

const pluginRegistry: any = {
    portalApps: [portalApp1, portalApp2, portalApp3],
};

const pluginContext: any = {
    loggerFactory: dummyLoggerFactory,
    services: {
        storage: {
        },
        security: {
            service: {
                getUser() {
                    return {
                        username: 'john',
                        displayName: 'John Do',
                        email: 'john.do@gmail.com',
                        roles: ['User', 'Role2'],
                    };
                },
                isAdmin() {
                    return true;
                },
                async checkResourcePermission() {
                    return true;
                }
            },
        },
        proxy: {
            service: {
                forward: httpProxyServiceForwardMock,
            },
        },
        portal: {
            service: {
                async findSiteByPath() {
                    return {
                        pages: [{

                        }]
                    }
                },
                async findPageRefByFriendlyUrl() {
                    return {

                    }
                },
                async getPage() {
                    return {
                        portalApps: {
                            'area1': [{
                                pluginName: 'Test Portal App 1',
                            }],
                            'area2': [{
                                pluginName: 'Test Portal App 2',
                            }]
                        }
                    }
                }
            }
        }
    },
};

describe('PortalPageController', () => {

    beforeEach(() => {
        httpProxyServiceForwardMock.mockReset();
    });

    it('forwards calls to the targetUri', async () => {

        const req: any = {
            originalUrl: '/portal/web/test/__/proxy/Test Portal App 1/my-proxy/foo/bar?x=1',
            params: {
                '0': 'Test Portal App 1/my-proxy/foo/bar?x=1',
            },
            connection: {
                remoteAddress: '127.0.0.1'
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        let status = null;
        const res: any = {
            sendStatus: (s: number) => status = s,
        };

        const controller = new PortalRestProxyController(pluginRegistry);

        await controller.forward(req, res);

        expect(status).toBeNull();
        expect(httpProxyServiceForwardMock.mock.calls.length).toBe(1);
        expect(httpProxyServiceForwardMock.mock.calls[0][2]).toBe('https://www.mashroom-server.com/api/foo/bar?x=1');
    });

    it('sets the configured headers', async () => {

        const req: any = {
            originalUrl: '/portal/web/test/__/proxy/Test Portal App 2/my-proxy?x=2#33',
            params: {
                '0': 'Test Portal App 2/my-proxy?x=2#33',
            },
            connection: {
                remoteAddress: '127.0.0.1'
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        let status = null;
        const res: any = {
            sendStatus: (s: number) => status = s,
        };

        const controller = new PortalRestProxyController(pluginRegistry);

        await controller.forward(req, res);

        expect(status).toBeNull();
        expect(httpProxyServiceForwardMock.mock.calls.length).toBe(1);
        expect(httpProxyServiceForwardMock.mock.calls[0][2]).toBe('https://www.mashroom-server.com/api?x=2');
        expect(httpProxyServiceForwardMock.mock.calls[0][3]).toEqual({
            'X-USER-NAME': 'john',
            'X-USER-DISPLAY-NAME': 'John Do',
            'X-USER-EMAIL': 'john.do@gmail.com',
            'X-USER-PERMISSIONS': 'edit',
            'X-EXTRA': 'test',
        });
    });

    it('does not forwards calls if the user has not on of the restrictToRoles', async () => {

        const req: any = {
            params: {
                '0': 'Test Portal App 3/my-proxy/foo',
            },
            connection: {
                remoteAddress: '127.0.0.1'
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        let status = null;
        const res: any = {
            sendStatus: (s: number) => status = s,
        };

        const controller = new PortalRestProxyController(pluginRegistry);

        await controller.forward(req, res);

        expect(status).toBe(403);
    });


});
