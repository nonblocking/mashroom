// @flow

import path from 'path';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import PortalPageRenderController from '../../../src/backend/controllers/PortalPageRenderController';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    warnBeforeAuthenticationExpiresSec: 120,
    autoExtendAuthentication: false
});

import type {MashroomPortalTheme, MashroomPortalLayout} from '../../../type-definitions';

describe('PortalPageRenderController', () => {

    const theme: MashroomPortalTheme = {
        name: 'my-theme',
        description: null,
        lastReloadTs: Date.now(),
        engineName: 'fooEngine',
        requireEngine: () => {},
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

    const pluginRegistry1: any = {
        themes: [],
        layouts: [],
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
                    updatePage() {},
                    getPortalAppInstance() {
                        return portalAppInstance1;
                    },
                    updatePortalAppInstance() {},
                    insertPortalAppInstance() {},
                    deletePortalAppInstance() {}
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
                    translate: (req, str) => str,
                    getMessage: () => 'error'
                },
            },
        },
    };

    it('renders a page based on a minimal template if no theme is set', (done) => {
        const webApp: any = {
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        let type = 0;
        const res: any = {
            type: (t: string) => type = t,
            send: (body: string) => {
                expect(type).toBe('text/html');
                expect(body).toBeTruthy();
                expect(body).toContain('<title>Server - Default Site - Test Page</title>');
                expect(body).toContain('window[\'MashroomPortalApiPath\'] = \'/portal/_/api\';');
                expect(body).toContain('<script src="/portal/_/client.js?');
                expect(body).toContain('var portalAppService = MashroomPortalServices.portalAppService;');
                expect(body).toContain('portalAppService.loadApp(\'app-area1\', \'Mashroom Welcome Portal App\', \'ABCDEF\', null, null);');
                expect(body).toContain('portalAppService.loadApp(\'mashroom-portal-admin-app-container\', \'admin-portal-app\', null, null, null);');
                done();
            },
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry1, Date.now());
        controller.renderPortalPage(req, res);
    });

    it('renders a page based on a given theme and layout', (done) => {

        let engineName = null;
        const webappProps = new Map();
        const webApp: any = {
            engine: (name) => engineName = name,
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            connection: {
                remoteAddress: '127.0.0.1'
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            pluginContext,
        };

        const res: any = {
            render: (template: string, model: Object) => {
                expect(template).toBe('portal');

                expect(engineName).toBe('fooEngine');
                expect(webappProps.get('view engine')).toBe('fooEngine');
                expect(webappProps.get('views')).toBe('./views');

                expect(model.site).toEqual({siteId: 'default', pages: [{pageId: 'test-page', friendlyUrl: '/bar', hidden: false, subPages: [], title: 'Test Page'}], path: '/web', title: 'Default Site'});
                expect(model.page).toEqual({pageId: 'test-page', hidden: false, friendlyUrl: '/bar', layout: 'my-layout', portalApps: {'app-area1': [{instanceId: 'ABCDEF', pluginName: 'Mashroom Welcome Portal App'}], 'app-area2': [{instanceId: '2', pluginName: 'Portal App 2'}, {instanceId: '3', pluginName: 'Portal App 3'}]}, theme: 'my-theme', title: 'Test Page'});
                expect(model.siteBasePath).toBe('/portal/foo');
                expect(model.resourcesBasePath).toBe('/portal/_/theme-resources/my-theme');
                expect(model.portalLayout).toBe('<div class="row"><div id="app-area1"></div><div id="app-area2"></div></div>\n');

                done();
            },
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry2, Date.now());
        controller.renderPortalPage(req, res);
    });

});
