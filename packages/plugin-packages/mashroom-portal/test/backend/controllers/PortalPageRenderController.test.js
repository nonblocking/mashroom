// @flow

import path from 'path';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import PortalPageRenderController from '../../../src/backend/controllers/PortalPageRenderController';
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
    portalAppEnhancements: [],
    portalPageEnhancements: [],
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
    portalAppEnhancements: [],
    portalPageEnhancements: [],
};

const pluginRegistry3: any = {
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
    portalAppEnhancements: [{
        name: 'Test App Enhancement',
        description: null,
        portalCustomClientServices: {
            'customService': 'foo'
        },
    }],
    portalPageEnhancements: [{
        name: 'Test Page Enhancement',
        resourcesRootUri: 'file://' + __dirname,
        order: 500,
        pageResources: {
            js: [{
                path: 'test_script1.js',
                rule: 'yes',
                location: 'header',
                inline: false,
            }, {
                path: 'test_script2.js',
                location: 'footer',
                inline: true,
            }, {
                path: 'test_script3.js',
                rule: 'no',
                location: 'footer',
                inline: false,
            }, {
                dynamicResource: 'generatedScript',
                rule: 'yes',
                location: 'header',
            }],
            css: [{
                path: 'test_style1.css',
                location: 'footer',
                inline: false,
            }, {
                path: 'test_style2.css',
                location: 'header',
                inline: true,
            }]
        },
        plugin: {
            dynamicResources: {
                generatedScript: () => 'console.info("I am generated!");',
            },
            rules: {
                'yes': () => true,
                'no': () => false,
            }
        }
    }, {
        name: 'Test Page Enhancement 2',
        resourcesRootUri: 'file://' + __dirname,
        order: 0,
        pageResources: {
            js: [{
                path: 'very_important_stuff.js',
                location: 'header',
            }]
        },
    }]
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
            pluginName: 'Mashroom Welcome Portal App',
            instanceId: '2',
        }, {
            pluginName: 'Mashroom Welcome Portal App 2',
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
    serverInfo: {
        devMode: true,
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

describe('PortalPageRenderController', () => {

    it('renders a page based on a minimal template if no theme is set', (done) => {
        const webApp: any = {
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            params: {
                sitePath: 'web',
            },
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
                expect(body).toContain('window[\'MashroomPortalApiPath\'] = \'/portal/web/___/api\';');
                expect(body).toContain('<script src="/portal/web/___/client.js?');
                expect(body).toContain('var portalAppService = MashroomPortalServices.portalAppService;');
                expect(body).toContain('portalAppService.loadApp(\'app-area1\', \'Mashroom Welcome Portal App\', \'ABCDEF\', null, null);');
                expect(body).toContain('portalAppService.loadApp(\'mashroom-portal-admin-app-container\', \'admin-portal-app\', null, null, null);');
                expect(body).toContain('window[\'MashroomPortalPreloadedAppSetup\']');
                done();
            },
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry1);
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
            params: {
                sitePath: 'web',
            },
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
                expect(model.page).toEqual({pageId: 'test-page', hidden: false, friendlyUrl: '/bar', layout: 'my-layout', portalApps: {'app-area1': [{instanceId: 'ABCDEF', pluginName: 'Mashroom Welcome Portal App'}], 'app-area2': [{instanceId: '2', pluginName: 'Mashroom Welcome Portal App'}, {instanceId: '3', pluginName: 'Mashroom Welcome Portal App 2'}]}, theme: 'my-theme', title: 'Test Page'});
                expect(model.siteBasePath).toBe('/portal/web');
                expect(model.resourcesBasePath).toBe('/portal/web/___/theme/my-theme');
                expect(model.apiBasePath).toBe('/portal/web/___/api');
                expect(model.portalLayout).toBe('<div class="row"><div id="app-area1"></div><div id="app-area2"></div></div>\n');

                done();
            },
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry2);
        controller.renderPortalPage(req, res);
    });

    it('renders a page with enhancement plugins', (done) => {
        let engineName = null;
        const webappProps = new Map();
        const webApp: any = {
            engine: (name) => engineName = name,
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/foo/bar',
            params: {
                sitePath: 'web',
            },
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

                // console.info(model.portalResourcesHeader);
                // console.info(model.portalResourcesFooter);

                expect(model.portalResourcesHeader).toContain('window[\'MashroomPortalCustomClientServices\'] = {"customService":"foo"};');
                expect(model.portalResourcesHeader).toContain('<script src="/portal/web/___/page-enhancements/Test%20Page%20Enhancement/test_script1.js"></script>');
                expect(model.portalResourcesHeader).toContain(' .bar {');
                expect(model.portalResourcesHeader).toContain('console.info("I am generated!");');

                expect(model.portalResourcesFooter).toContain('console.info(\'Script2\');');
                expect(model.portalResourcesFooter).toContain('<link rel="stylesheet" href="/portal/web/___/page-enhancements/Test%20Page%20Enhancement/test_style1.css" />');
                expect(model.portalResourcesFooter).not.toContain('test_script3.js');

                const posScript1 = model.portalResourcesHeader.indexOf('/test_script1.js');
                const posVeryImportantScript = model.portalResourcesHeader.indexOf('/very_important_stuff.js');
                expect(posVeryImportantScript < posScript1).toBeTruthy();

                done();
            },
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry3);
        controller.renderPortalPage(req, res);
    });

});
