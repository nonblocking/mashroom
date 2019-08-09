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
        autoLogoutAfterInactivitySec: 1800
    });

    const portalApp: MashroomPortalApp = {
        name: 'Test Portal App',
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
        globalResources: {
            js: [],
            css: [],
        },
        screenshots: null,
        defaultRestrictedToRoles: null,
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

    const portalAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Test Portal App',
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
                pluginName: 'Test Portal App',
                instanceId: 'ABCD',
            }],
        },
    };

    const pluginRegistry: any = {
        portalApps: [portalApp],
    };

    const pluginContext: any = {
        loggerFactory: dummyLoggerFactory,
        services: {
            portal: {
                service: {
                    getPage() {
                        return page1;
                    },
                    getPortalAppInstance() {
                        return portalAppInstance1;
                    },

                },
            },
            security: {
                service: {
                    getUser() {
                        return {
                            username: 'admin',
                            roles: ['Administrator'],
                        };
                    },
                    isAdmin() {
                        return true
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
                pageId: '123',
                pluginName: 'Test Portal App',
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
            pluginName: 'Test Portal App',
            title: 'Translated title',
            version: '1.0',
            instanceId: 'ABCD',
            lastReloadTs: 222222222,
            restProxyPaths: {
                '1': '/portal/_/proxy/Test%20Portal%20App/1',
            },
            resourcesBasePath: '/portal/_/app-resources/Test%20Portal%20App',
            globalResourcesBasePath: '/portal/_/app-resources/_global_',
            resources: {css: [], js: ['bundle.js']},
            globalLaunchFunction: 'foo',
            lang: 'en',
            user: {
                username: 'admin',
                displayName: 'admin',
                guest: false,
                permissions: {
                    delete: true
                },
            },
            appConfig: {
                hello: 'peter',
                foo: 'bar',
            },
        });
    });

    it('loads resources from filesystem', (done) => {
        const req: any = {
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                'pluginName': 'Test Portal App',
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
