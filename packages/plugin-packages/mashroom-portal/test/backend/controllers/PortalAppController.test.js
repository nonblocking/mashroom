// @flow

import {Writable} from 'stream';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import '../../../src/backend/context/global_portal_context';
import PortalAppController from '../../../src/backend/controllers/PortalAppController';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';

import type {MashroomPortalApp, MashroomPortalAppInstance, MashroomPortalPage} from '../../../type-definitions';

describe('PortalAppController', () => {

    setPortalPluginConfig({
        path: '/portal',
        adminApp: 'admin-portal-app',
        defaultTheme: 'foo',
        defaultLayout: 'foo',
        warnBeforeAuthenticationExpiresSec: 120,
        autoExtendAuthentication: false
    });

    const portalApp1: MashroomPortalApp = {
        name: 'Test Portal App 1',
        title: {
            "en": "Test Portal App",
            "de": "Test Test Test"
        },
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
        resourcesRootUri: `file:/${__dirname}`,
        resources: {
            js: ['bundle.js'],
            css: [],
        },
        sharedResources: {
            js: [],
            css: [],
        },
        screenshots: null,
        defaultRestrictViewToRoles: ["Role1"],
        rolePermissions: {
            'edit': ['Role1'],
            'delete': ['Administrator']
        },
        restProxies: {
            '1': {
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
        title: {} ,
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
        resourcesRootUri: `file:/${__dirname}`,
        resources: {
            js: ['bundle.js'],
            css: [],
        },
        sharedResources: {
            js: [],
            css: [],
        },
        screenshots: null,
        defaultRestrictViewToRoles: ["OtherRole"],
        rolePermissions: {},
        restProxies: {},
        defaultAppConfig: {},
    };

    const portalAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Test Portal App 1',
        instanceId: 'ABCD',
        appConfig: {
            'hello': 'peter',
        },
    };

    const page1: MashroomPortalPage = {
        pluginName: 'Test page',
        pageId: 'foo',
        portalApps: {
            'area1': [{
                pluginName: 'Test Portal App 1',
                instanceId: 'ABCD',
            }],
        },
    };

    const pluginRegistry: any = {
        portalApps: [portalApp1, portalApp2],
    };

    const pluginContext: any = {
        loggerFactory: dummyLoggerFactory,
        services: {
            portal: {
                service: {
                    async findSiteByPath() {
                        return {

                        }
                    },
                    async getPage() {
                        return page1;
                    },
                    async getPortalAppInstance(name, id) {
                        if (id) {
                            return portalAppInstance1;
                        }
                        return null;
                    },
                },
            },
            security: {
                service: {
                    getUser() {
                        return {
                            username: 'test',
                            displayName: 'Test User',
                            email: 'test@test.com',
                            roles: ['Role1'],
                            extraData: {
                                'customerId': 12345678,
                            },
                        };
                    },
                    isAdmin() {
                        return false
                    },
                    async checkResourcePermission() {
                        return true;
                    }
                },
            },
            i18n: {
                service: {
                    getLanguage: () => 'en',
                    translate: () => 'Translated title'
                },
            },
        },
    };

    it('generates portal app setup', async () => {

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                sitePath: 'web',
                pageId: '123',
                pluginName: 'Test Portal App 1',
                portalAppInstanceId: 'ABCD',
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        let json = null;
        const res: any = {
            json: (data: string) => json = data,
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getPortalAppSetup(req, res);

        expect(json).toBeTruthy();
        expect(json).toEqual({
            pluginName: 'Test Portal App 1',
            title: 'Translated title',
            version: '1.0',
            instanceId: 'ABCD',
            lastReloadTs: 222222222,
            restProxyPaths: {
                '1': '/portal/web/___/proxy/Test%20Portal%20App%201/1',
            },
            resourcesBasePath: '/portal/web/___/apps/Test%20Portal%20App%201',
            sharedResourcesBasePath: '/portal/web/___/apps/_shared_',
            sharedResources: {
                js: [],
                css: [],
            },
            resources: {css: [], js: ['bundle.js']},
            globalLaunchFunction: 'foo',
            lang: 'en',
            user: {
                guest: false,
                username: 'test',
                displayName: 'Test User',
                email: 'test@test.com',
                permissions: {
                    edit: true
                },
                extraData: {
                    customerId: 12345678,
                },
            },
            appConfig: {
                hello: 'peter',
                foo: 'bar',
            },
        });
    });

    it('generates portal app setup for a dynamically loaded app', async () => {

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                sitePath: 'web',
                pageId: '123',
                pluginName: 'Test Portal App 1',
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        let json = null;
        const res: any = {
            json: (data: string) => json = data,
        };

        const controller = new PortalAppController(pluginRegistry);
        await controller.getPortalAppSetup(req, res);

        expect(json).toBeTruthy();
        expect(json).toEqual({
            pluginName: 'Test Portal App 1',
            title: 'Translated title',
            version: '1.0',
            instanceId: null,
            lastReloadTs: 222222222,
            restProxyPaths: {
                '1': '/portal/web/___/proxy/Test%20Portal%20App%201/1',
            },
            resourcesBasePath: '/portal/web/___/apps/Test%20Portal%20App%201',
            sharedResourcesBasePath: '/portal/web/___/apps/_shared_',
            sharedResources: {
                js: [],
                css: [],
            },
            resources: {css: [], js: ['bundle.js']},
            globalLaunchFunction: 'foo',
            lang: 'en',
            user: {
                guest: false,
                username: 'test',
                displayName: 'Test User',
                email: 'test@test.com',
                permissions: {
                    edit: true
                },
                extraData: {
                    customerId: 12345678,
                },
            },
            appConfig: {
                hello: 'world',
                foo: 'bar',
            },
        });
    });

    it('rejects dynamical app setup when the user has none of defaultRestrictViewToRoles', (done) => {

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                pluginName: 'Test Portal App 2',
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        const res: any = {
            sendStatus: (status) => {
                expect(status).toBe(403);
                done();
            }
        };

        const controller = new PortalAppController(pluginRegistry);
        controller.getPortalAppSetup(req, res);
    });

    it('loads resources from filesystem', (done) => {
        const req: any = {
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                'pluginName': 'Test Portal App 1',
                '0': '/PortalAppController.test.js',
            },
            pluginContext,
            query: {},
        };

        const res: any = new Writable({
            write: (chunk) => {
                expect(chunk).toBeTruthy();
                done();
            },
        });

        res.type = () => {};
        res.set = () => {};

        const controller = new PortalAppController(pluginRegistry);
        controller.getPortalAppResource(req, res);
    });
});
