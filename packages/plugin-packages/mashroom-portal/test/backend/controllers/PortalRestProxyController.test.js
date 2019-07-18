// @flow

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import '../../../src/backend/context/global_portal_context';
import PortalRestProxyController from '../../../src/backend/controllers/PortalRestProxyController';

import type {MashroomPortalApp} from '../../../type-definitions';

describe('PortalPageController', () => {

    const httpProxyServiceForwardMock = jest.fn();

    const portalApp1: MashroomPortalApp = {
        name: 'Test Portal App 1',
        title: null,
        description: null,
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
        globalResources: null,
        screenshots: null,
        defaultRestrictedToRoles: null,
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
        globalResources: null,
        screenshots: null,
        defaultRestrictedToRoles: null,
        rolePermissions: {
            'edit': ['Role2'],
            'delete': ['Administrator']
        },
        restProxies: {
            'my-proxy': {
                targetUri: 'https://www.mashroom-server.com/api',
                sendUserHeader: true,
                sendPermissionsHeader: true,
                sendRolesHeader: true,
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

    const pluginRegistry: any = {
        portalApps: [portalApp1, portalApp2],
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
                            roles: ['User', 'Role2'],
                            extraHttpHeaders: {
                                'Authorization': 'Bearer mytoken123'
                            }
                        };
                    },
                    isAdmin() {
                        return true;
                    },
                },
            },
            proxy: {
                service: {
                    forward: httpProxyServiceForwardMock,
                },
            },
        },
    };

    beforeEach(() => {
        httpProxyServiceForwardMock.mockReset();
    });

    it('forwards calls to the targetUri', async () => {

        const req: any = {
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
            sendStatus: (s) => status = s,
        };

        const controller = new PortalRestProxyController(pluginRegistry);

        await controller.forward(req, res);

        expect(status).toBeNull();
        expect(httpProxyServiceForwardMock.mock.calls.length).toBe(1);
        expect(httpProxyServiceForwardMock.mock.calls[0][2]).toBe('https://www.mashroom-server.com/api/foo/bar?x=1');
    });

    it('sets the configured headers', async () => {

        const req: any = {
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
            sendStatus: (s) => status = s,
        };

        const controller = new PortalRestProxyController(pluginRegistry);

        await controller.forward(req, res);

        expect(status).toBeNull();
        expect(httpProxyServiceForwardMock.mock.calls.length).toBe(1);
        expect(httpProxyServiceForwardMock.mock.calls[0][2]).toBe('https://www.mashroom-server.com/api?x=2');
        expect(httpProxyServiceForwardMock.mock.calls[0][3]).toEqual({
            'X-USER-NAME': 'john',
            'X-USER-PERMISSIONS': 'edit',
            'X-USER-ROLES': 'User,Role2',
            'Authorization': 'Bearer mytoken123',
            'X-EXTRA': 'test',
        });
    });

});
