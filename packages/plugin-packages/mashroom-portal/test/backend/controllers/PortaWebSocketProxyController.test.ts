
import {loggingUtils} from '@mashroom/mashroom-utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import PortalWebSocketpProxyController from '../../../src/backend/controllers/PortalWebSocketProxyController';
import type {MashroomPortalApp} from '../../../type-definitions';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    authenticationExpiration: {
        warnBeforeExpirationSec: 120,
        autoExtend: false,
        onExpiration: { strategy: 'reload' },
    },
    ignoreMissingAppsOnPages: false,
    versionHashSalt: null,
    resourceFetchConfig: {
        fetchTimeoutMs: 3000,
        httpMaxSocketsPerHost: 10,
        httpRejectUnauthorized: true,
    },
    defaultProxyConfig: {
        sendPermissionsHeader: false,
        restrictToRoles: [],
    },
    ssrConfig: {
        ssrEnable: false,
        renderTimoutMs: 2000,
        cacheEnable: false,
        cacheTTLSec: 300,
        inlineStyles: true,
    }
});

const httpProxyServiceForwardMock = jest.fn();
const httpProxyServiceForwardWsMock = jest.fn();

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
    clientBootstrap: 'foo',
    resourcesRootUri: `file://${__dirname}`,
    remoteApp: false,
    ssrBootstrap: undefined,
    ssrInitialHtmlUri: undefined,
    cachingConfig: undefined,
    editorConfig: undefined,
    resources: {
        js: ['bundle.js'],
        css: [],
    },
    sharedResources: null,
    screenshots: null,
    defaultRestrictViewToRoles: null,
    rolePermissions: null,
    proxies: {
        'my-proxy': {
            targetUri: 'https://www.mashroom-server.com/api',
        },
        'my-ws-proxy': {
            targetUri: 'wss://www.mashroom-server.com/ws',
        },
    },
    defaultAppConfig: {
        hello: 'world',
        foo: 'bar',
    },
};

const pluginRegistry: any = {
    portalApps: [portalApp1],
};

const pluginContext: any = {
    loggerFactory: loggingUtils.dummyLoggerFactory,
    services: {
        core: {
            middlewareStackService: {
                apply: () => { /* nothing to do */ },
                has: () => false,
            }
        },
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
                forwardWs: httpProxyServiceForwardWsMock,
            },
        },
        portal: {
            service: {
                async findSiteByPath() {
                    return {
                        pages: [{

                        }]
                    };
                },
                async findPageRefByFriendlyUrl() {
                    return {

                    };
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
                    };
                }
            }
        }
    },
};

describe('PortalPageController', () => {

    beforeEach(() => {
        httpProxyServiceForwardMock.mockReset();
    });

    it('forwards WebSocket requests to the targetUri', async () => {
        const req: any = {
            url: '/portal/web/___/proxy/Test%20Portal%20App%201/my-ws-proxy/foo?x=1',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        const socket: any = {
            end() { /* nothing to do */ },
        };
        const head = Buffer.from('');

        const controller = new PortalWebSocketpProxyController('/portal', pluginRegistry);

        await controller.forward(req, socket, head);

        expect(httpProxyServiceForwardWsMock.mock.calls.length).toBe(1);
        expect(httpProxyServiceForwardWsMock.mock.calls[0][3]).toBe('wss://www.mashroom-server.com/ws/foo?x=1');
    });
});
