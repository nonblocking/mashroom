
import path from 'path';
// @ts-ignore
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import PortalPageController from '../../../src/backend/controllers/PortalPageController';
import type {MashroomPortalTheme, MashroomPortalLayout} from '../../../type-definitions';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    warnBeforeAuthenticationExpiresSec: 120,
    autoExtendAuthentication: false
});

const theme: MashroomPortalTheme = {
    name: 'my-theme',
    description: null,
    lastReloadTs: Date.now(),
    engineName: 'fooEngine',
    requireEngine: () => { /* nothing to do */ },
    resourcesRootPath: './public',
    viewsPath: './views',
};

const layout: MashroomPortalLayout = {
    name: 'my-layout',
    description: null,
    lastReloadTs: Date.now(),
    layoutId: 'test',
    layoutPath: path.resolve(__dirname, './test_layout.html'),
};

const pluginRegistry2: any = {
    themes: [theme],
    layouts: [layout],
    portalApps: [{
        name: 'Mashroom Welcome Portal App',
        defaultAppConfig: {
            firstName: 'John',
        },
    }, {
        name: 'Mashroom Welcome Portal App 2',
        defaultAppConfig: {
            firstName: 'Foo',
        },
    }],
};

const site: any = {
    siteId: 'default',
    title: 'Default Site',
    path: '/web',
    pages: [
        {
            pageId: 'test-page',
            title: 'Test Page',
            friendlyUrl: '/bar',
            subPages: [],
        },
    ],
};

const page1: any = {
    pageId: 'test-page',
    theme: 'my-theme',
    layout: 'my-layout',
    portalApps: {
        'app-area1': [{
            pluginName: 'Mashroom Welcome Portal App',
            instanceId: 'ABCDEF',
        }],
        'app-area2': [{
            pluginName: 'Portal App 2',
            instanceId: '2',
        }, {
            pluginName: 'Portal App 3',
            instanceId: '3',
        }],
    },
};

const portalAppInstance1: any = {
    pluginName: 'Mashroom Welcome Portal App',
    instanceId: 'ABCDEF',
    appConfig: {},
};

const pluginContext: any = {
    serverConfig: {
        name: 'Server',
        portal: {
            adminApp: 'admin-portal-app',
        },
    },
    loggerFactory: dummyLoggerFactory,
    services: {
        portal: {
            service: {
                findSiteByPath() {
                    return site;
                },
                findPageRefByFriendlyUrl() {
                    return site.pages[0];
                },
                getPage() {
                    return page1;
                },
                updatePage() { /* nothing to do */ },
                getPortalAppInstance() {
                    return portalAppInstance1;
                },
                updatePortalAppInstance() { /* nothing to do */ },
                insertPortalAppInstance() { /* nothing to do */ },
                deletePortalAppInstance() { /* nothing to do */ }
            },
        },
        security: {
            service: {
                async getUser() {
                    return {
                        username: 'admin',
                        roles: ['Administrator'],
                    };
                },
                isInRole() {
                    return true;
                },
                isAdmin() {
                    return true;
                },
                async checkResourcePermission() {
                    return true;
                }
            },
        },
        i18n: {
            service: {
                getLanguage: () => 'en',
                translate: (req: any, str: string) => str
            },
        },
    },
};

describe('PortalPageController', () => {

    it('returns all app instances on the page', (done) => {

        const req: any = {
            pluginContext,
            params: {
                pageId: 'foo',
            },
        };

        const res: any = {
            json(data: any) {
                expect(data).toEqual([
                    {
                        pluginName: 'Mashroom Welcome Portal App',
                        instanceId: 'ABCDEF',
                        areaId: 'app-area1',
                        position: 0,
                    },
                    {
                        pluginName: 'Portal App 2',
                        instanceId: '2',
                        areaId: 'app-area2',
                        position: 0,
                    }, {
                        pluginName: 'Portal App 3',
                        instanceId: '3',
                        areaId: 'app-area2',
                        position: 1,
                    },
                ]);
                done();
            },
        };

        const controller = new PortalPageController(pluginRegistry2);
        controller.getPortalAppInstances(req, res);
    });

    it('adds a new app instances to an app area on the page', (done) => {

        const req: any = {
            pluginContext,
            params: {
                pageId: 'foo',
            },
            body: {
                pluginName: 'Mashroom Welcome Portal App 2',
                areaId: 'app-area1',
                appConfig: {
                    foo: 'bar',
                },
            },
        };

        const res: any = {
            json(data: any) {
                expect(data.pluginName).toBe('Mashroom Welcome Portal App 2');
                expect(data.position).toBe(1);
                done();
            },
        };

        const controller = new PortalPageController(pluginRegistry2);
        controller.addPortalApp(req, res);
    });

    it('adds a new app instances to an app area at a given position on the page', (done) => {

        const req: any = {
            pluginContext,
            params: {
                pageId: 'foo',
            },
            body: {
                pluginName: 'Mashroom Welcome Portal App 2',
                areaId: 'app-area1',
                position: 0,
                appConfig: {
                    foo: 'bar',
                },
            },
        };

        const res: any = {
            json(data: any) {
                expect(data.pluginName).toBe('Mashroom Welcome Portal App 2');
                expect(data.position).toBe(0);
                done();
            },
        };

        const controller = new PortalPageController(pluginRegistry2);
        controller.addPortalApp(req, res);
    });

    it('updates an app instance', (done) => {

        const webApp: any = {
        };

        const req: any = {
            pluginContext,
            params: {
                pageId: 'foo',
                pluginName: 'Mashroom Welcome Portal App',
                portalAppInstanceId: 'ABCDEF',
            },
            body: {
                areaId: 'app-area2',
                position: 1,
                appConfig: {
                    foo: 'm',
                },
            },
        };

        const res: any = {
            end() {
                done();
            },
        };

        const controller = new PortalPageController(pluginRegistry2);
        controller.updatePortalApp(req, res);
    });

    it('removes an app instance', (done) => {

        const req: any = {
            pluginContext,
            params: {
                pageId: 'foo',
                pluginName: 'Portal App 2',
                portalAppInstanceId: '2',
            },
        };

        const res: any = {
            end() {
                done();
            },
        };

        const controller = new PortalPageController(pluginRegistry2);
        controller.removePortalApp(req, res);
    });
});
