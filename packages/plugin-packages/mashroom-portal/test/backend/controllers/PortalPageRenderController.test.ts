
import path from 'path';
import {loggingUtils} from '@mashroom/mashroom-utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import PortalPageRenderController from '../../../src/backend/controllers/PortalPageRenderController';
import type {MashroomPortalTheme, MashroomPortalLayout, MashroomPortalPageRenderModel, MashroomPortalPageContent} from '../../../type-definitions';

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
    defaultProxyConfig: {},
    ssrConfig: {
        ssrEnable: true,
        renderTimoutMs: 2000,
        cacheEnable: false,
        cacheTTLSec: 300,
        inlineStyles: true,
    }
});

const theme: MashroomPortalTheme = {
    name: 'my-theme',
    description: null,
    lastReloadTs: Date.now(),
    version: '1.0.0',
    engineName: 'fooEngine',
    requireEngine: () => { return {} as any; },
    resourcesRootPath: './public',
    viewsPath: './views',
};

const layout: MashroomPortalLayout = {
    name: 'my-layout',
    description: null,
    lastReloadTs: Date.now(),
    layoutId: 'test',
    layoutPath: path.resolve(__dirname, './test-layout.html'),
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
        ssrBootstrap: `${__dirname}/ssr-bootstrap2.js`,
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
            customService: 'foo'
        },
        lastReloadTs: 1000,
    }],
    portalPageEnhancements: [{
        name: 'Test Page Enhancement',
        resourcesRootUri: `file:///${__dirname}`,
        order: 500,
        lastReloadTs: 2000,
        pageResources: {
            js: [{
                path: 'test-script1.js',
                rule: 'yes',
                location: 'header',
                inline: false,
            }, {
                path: 'test-script2.js',
                location: 'footer',
                inline: true,
            }, {
                path: 'test-script3.js',
                rule: 'onlyOnPage4',
                location: 'footer',
                inline: false,
            }, {
                dynamicResource: 'generatedScript',
                rule: 'yes',
                location: 'header',
            }],
            css: [{
                path: 'test-style1.css',
                location: 'footer',
                inline: false,
            }, {
                path: 'test-style2.css',
                location: 'header',
                inline: true,
            }]
        },
        plugin: {
            dynamicResources: {
                generatedScript: () => 'console.info("I am generated!");',
            },
            rules: {
                yes: () => true,
                no: () => false,
                onlyOnPage4: (sitePath: string, pageFriendlyUrl: string) => pageFriendlyUrl === '/same',
            }
        }
    }, {
        name: 'Test Page Enhancement 2',
        resourcesRootUri: `file://${__dirname}`,
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
        {
            pageId: 'test-page2',
            title: 'Test Page 2',
            friendlyUrl: '/foo',
            subPages: [],
        },
        {
            pageId: 'test-page3',
            title: 'Test Page 3',
            friendlyUrl: '/woohooo',
            subPages: [],
        },
        {
            pageId: 'test-page4',
            title: 'Test Page 4',
            friendlyUrl: '/same',
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

const page2: any = {
    pageId: 'test-page2',
    theme: 'my-theme2'
};

const page3: any = {
    pageId: 'test-page3',
    theme: 'my-theme'
};

const page4: any = {
    pageId: 'test-page4',
    theme: 'my-theme'
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
        devMode: false,
    },
    loggerFactory: loggingUtils.dummyLoggerFactory,
    services: {
        portal: {
            service: {
                getPortalApps() {
                    return [{
                        name: 'Mashroom Welcome Portal App 2',
                        ssrBootstrap: `${__dirname}/ssr-bootstrap.js`,
                        resourcesRootUri: `file://${__dirname}`,
                        resources: {
                            js: ['bundle.js'],
                        },
                    }];
                },
                findSiteByPath() {
                    return site;
                },
                findPageRefByFriendlyUrl(site: any, friendlyUrl: string) {
                    return site.pages.find((page: any) => page.friendlyUrl === friendlyUrl);
                },
                findPageRefByPageId(site: any, pageId: string) {
                    return site.pages.find((page: any) => page.pageId === pageId);
                },
                getPage(pageId: string) {
                    if (pageId === 'test-page2') {
                        return page2;
                    } else if (pageId === 'test-page3') {
                        return page3;
                    } else if (pageId === 'test-page4') {
                        return page4;
                    }
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
                translate: (req: any, str: string) => str,
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
            path: '/bar',
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

        let type: string | undefined;
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
        let engineName: string | undefined;
        const webappProps = new Map();
        const webApp: any = {
            engine: (name: string) => engineName = name,
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/bar',
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
            type: () => { /* nothing to do */ },
            render: (template: string, model: any, cb: (error: any, html: string) => void) => {
                if (template === 'portal') {
                    const portalModel = model as MashroomPortalPageRenderModel;

                    expect(engineName).toBe('fooEngine');
                    expect(webappProps.get('view engine')).toBe('fooEngine');
                    expect(webappProps.get('views')).toBe('./views');

                    expect(portalModel.site).toEqual({
                        siteId: 'default',
                        title: 'Default Site',
                        path: '/web',
                        pages: [
                            {
                                pageId: 'test-page',
                                title: 'Test Page',
                                friendlyUrl: '/bar',
                                hidden: false,
                                subPages: []
                            },
                            {
                                pageId: 'test-page2',
                                title: 'Test Page 2',
                                friendlyUrl: '/foo',
                                hidden: false,
                                subPages: []
                            },
                            {
                                pageId: 'test-page3',
                                title: 'Test Page 3',
                                friendlyUrl: '/woohooo',
                                hidden: false,
                                subPages: []
                            },
                            {
                                pageId: 'test-page4',
                                title: 'Test Page 4',
                                friendlyUrl: '/same',
                                hidden: false,
                                subPages: []
                            }
                        ]
                    });

                    expect(portalModel.page).toEqual({pageId: 'test-page', hidden: false, friendlyUrl: '/bar', layout: 'my-layout', portalApps: {'app-area1': [{instanceId: 'ABCDEF', pluginName: 'Mashroom Welcome Portal App'}], 'app-area2': [{instanceId: '2', pluginName: 'Mashroom Welcome Portal App'}, {instanceId: '3', pluginName: 'Mashroom Welcome Portal App 2'}]}, theme: 'my-theme', title: 'Test Page'});
                    expect(portalModel.siteBasePath).toBe('/portal/web');
                    expect(portalModel.resourcesBasePath).toBe('/portal/web/___/theme/my-theme');
                    expect(portalModel.apiBasePath).toBe('/portal/web/___/api');

                    expect(portalModel.portalResourcesHeader).toContain('window[\'MashroomPortalApiPath\'] = \'/portal/web/___/api\'');
                    expect(portalModel.portalResourcesHeader).toContain('window[\'MashroomPortalSiteUrl\'] = \'/portal/web\'');
                    expect(portalModel.portalResourcesHeader).toContain('window[\'MashroomPortalPageId\'] = \'test-page\'');
                    expect(portalModel.portalResourcesHeader).toContain('window[\'MashroomPortalLanguage\'] = \'en\'');
                    expect(portalModel.portalResourcesHeader).toContain('window[\'MashroomPortalAppWrapperTemplate\'] = \'<div class="wrapper">???</div>\'');
                    expect(portalModel.portalResourcesHeader).toContain('<script src="/portal/web/___/client.js');
                    expect(portalModel.portalResourcesHeader).toContain('<script data-mashroom-ssr-head-script="1">alert("foo")</script>');

                    expect(portalModel.portalResourcesFooter).toContain('window[\'MashroomPortalPreloadedAppSetup\'] =');
                    expect(portalModel.portalResourcesFooter).toContain('portalAppService.loadApp(\'app-area1\', \'Mashroom Welcome Portal App\', \'ABCDEF\', null, null)');
                    expect(portalModel.portalResourcesFooter).toContain('portalAppService.loadApp(\'app-area2\', \'Mashroom Welcome Portal App\', \'2\', null, null)');
                    expect(portalModel.portalResourcesFooter).toContain('portalAppService.loadApp(\'app-area2\', \'Mashroom Welcome Portal App 2\', \'3\', null, null)');
                    expect(portalModel.portalResourcesFooter).toContain('portalAppService.loadApp(\'mashroom-portal-admin-app-container\', \'admin-portal-app\', null, null, null)');

                    expect(portalModel.pageContent).toContain('<div class="row"><div id="app-area1"><div class="wrapper">???</div></div><div id="app-area2"><div class="wrapper">???</div><div class="wrapper"><p>server side rendered html</p></div></div></div>');

                    cb(null, 'RENDERED CONTENT');
                    return;
                }

                // Templates: appWrapper, appError
                cb(null, `<div class="wrapper">${model.appSSRHtml ?? '???'}</div>`);
            },
            send: (body: string) => {
                expect(body).toBe('RENDERED CONTENT');
                done();
            }
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry2);
        controller.renderPortalPage(req, res);
    });

    it('renders a page with enhancement plugins', (done) => {
        const webappProps = new Map();
        const webApp: any = {
            engine: () => { /* ignore */ },
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/bar',
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
            type: () => { /* nothing to do */ },
            render: (template: string, model: MashroomPortalPageRenderModel, cb: (error: any, html: string) => void) => {
                if (template === 'portal') {
                    // console.info(model.portalResourcesHeader);
                    // console.info(model.portalResourcesFooter);

                    expect(model.portalResourcesHeader).toContain('window[\'MashroomPortalCustomClientServices\'] = {"customService":"foo"};');
                    expect(model.portalResourcesHeader).toContain('<script src="/portal/web/___/page-enhancements/Test%20Page%20Enhancement/test-script1.js?v=5e543256c4"></script>');
                    expect(model.portalResourcesHeader).toContain(' .bar {');
                    expect(model.portalResourcesHeader).toContain('console.info("I am generated!");');

                    expect(model.portalResourcesFooter).toContain('console.info(\'Script2\');');
                    expect(model.portalResourcesFooter).toContain('<link rel="stylesheet" href="/portal/web/___/page-enhancements/Test%20Page%20Enhancement/test-style1.css?v=5e543256c4" />');
                    expect(model.portalResourcesFooter).not.toContain('test-script3.js');

                    const posScript1 = model.portalResourcesHeader.indexOf('/test-script1.js');
                    const posVeryImportantScript = model.portalResourcesHeader.indexOf('/very_important_stuff.js');
                    expect(posVeryImportantScript < posScript1).toBeTruthy();
                }

                cb(null, '<div />');
            },
            send: (body: string) => {
                expect(body).toBe('<div />');

                done();
            }
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry3);
        controller.renderPortalPage(req, res);
    });

    it('returns the page content of a given pageId', (done) => {
        const webappProps = new Map();
        const webApp: any = {
            engine: () => { /* ignore */ },
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/bar',
            query: {

            },
            params: {
                pageId: 'test-page',
                sitePath: 'web',
            },
            pluginContext,
        };

        const res: any = {
            type: () => { /* nothing to do */ },
            render: (template: string, model: any, cb: (error: any) => void) => cb({message: 'Failed to lookup view XXX'}),
            json: (content: MashroomPortalPageContent) => {
                expect(content).toBeTruthy();

                expect(content.pageContent).toContain('<div id="app-area1">');
                expect(content.pageContent).toContain('<div data-mr-app-id="ABCDEF" data-mr-app-name="Mashroom Welcome Portal App" class="mashroom-portal-app-wrapper portal-app-mashroom-welcome-portal-app">');
                expect(content.pageContent).toContain('<div data-mr-app-content="app" class="mashroom-portal-app-host"><p>server side rendered html</p></div>');

                expect(content.evalScript).toContain('var existingScripts = headEl.querySelectorAll(\'script[data-mashroom-ssr-head-script]\')');
                expect(content.evalScript).toContain('headEl.removeChild(existingScripts[i])');
                expect(content.evalScript).toContain('scriptEl.setAttribute(\'data-mashroom-ssr-head-script\', \'1\');');
                expect(content.evalScript).toContain('scriptEl.innerText = `alert("foo")`;');
                expect(content.evalScript).toContain('portalAppService.unloadApp(app.id)');
                expect(content.evalScript).toContain('window[\'MashroomPortalPreloadedAppSetup\'] = ');
                expect(content.evalScript).toContain('portalAppService.loadApp(\'app-area1\', \'Mashroom Welcome Portal App\', \'ABCDEF\', null, null)');
                expect(content.evalScript).toContain('portalAppService.loadApp(\'app-area2\', \'Mashroom Welcome Portal App\', \'2\', null, null)');
                expect(content.evalScript).toContain('portalAppService.loadApp(\'app-area2\', \'Mashroom Welcome Portal App 2\', \'3\', null, null)');

                done();
            }
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry2);
        controller.getPortalPageContent(req, res);
    });

    it('doesn\'t return the page content if the theme is different from the original page', (done) => {
        const webappProps = new Map();
        const webApp: any = {
            engine: () => { /* ignore */ },
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/bar',
            query: {
                originalPageId: 'test-page2',
            },
            params: {
                pageId: 'test-page',
                sitePath: 'web',
            },
            pluginContext,
        };

        const res: any = {
            type: () => { /* nothing to do */ },
            render: (template: string, model: any, cb: (error: any) => void) => cb({message: 'Failed to lookup view XXX'}),
            json: (content: MashroomPortalPageContent) => {
                expect(content).toBeTruthy();
                expect(content).toEqual({
                    fullPageLoadRequired: true, pageContent: '', evalScript: '',
                });
                done();
            }
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry2);
        controller.getPortalPageContent(req, res);
    });

    it('returns the page content of a given pageId if the theme and the page enhancements of the original page match', (done) => {
        const webappProps = new Map();
        const webApp: any = {
            engine: () => { /* ignore */ },
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/bar',
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36'
            },
            query: {
                originalPageId: 'test-page3',
            },
            params: {
                pageId: 'test-page',
                sitePath: 'web',
            },
            pluginContext,
        };

        const res: any = {
            type: () => { /* nothing to do */ },
            render: (template: string, model: any, cb: (error: any) => void) => cb({message: 'Failed to lookup view XXX'}),
            json: (content: MashroomPortalPageContent) => {
                expect(content).toBeTruthy();
                expect(content.pageContent).toContain('<div id="app-area1">');
                done();
            }
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry3);
        controller.getPortalPageContent(req, res);
    });

    it('doesn\'t return the page content if page enhancements are missing', (done) => {
        const webappProps = new Map();
        const webApp: any = {
            engine: () => { /* ignore */ },
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/same',
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36'
            },
            query: {
                originalPageId: 'test-page',
            },
            params: {
                pageId: 'test-page4',
                sitePath: 'web',
            },
            pluginContext,
        };

        const res: any = {
            type: () => { /* nothing to do */ },
            render: (template: string, model: any, cb: (error: any) => void) => cb({message: 'Failed to lookup view XXX'}),
            json: (content: MashroomPortalPageContent) => {
                expect(content).toBeTruthy();
                expect(content).toEqual({
                    fullPageLoadRequired: true, pageContent: '', evalScript: '',
                });
                done();
            }
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry3);
        controller.getPortalPageContent(req, res);
    });

    it('returns the page content if the enhancements don\'t match but all required enhancements exist', (done) => {
        const webappProps = new Map();
        const webApp: any = {
            engine: () => { /* ignore */ },
            set: (key: string, value: any) => webappProps.set(key, value),
        };

        const req: any = {
            baseUrl: '/portal',
            path: '/bar',
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36'
            },
            query: {
                originalPageId: 'test-page4',
            },
            params: {
                pageId: 'test-page',
                sitePath: 'web',
            },
            pluginContext,
        };

        const res: any = {
            type: () => { /* nothing to do */ },
            render: (template: string, model: any, cb: (error: any) => void) => cb({message: 'Failed to lookup view XXX'}),
            json: (content: MashroomPortalPageContent) => {
                expect(content).toBeTruthy();
                expect(content.pageContent).toContain('<div id="app-area1">');
                done();
            }
        };

        const controller = new PortalPageRenderController(webApp, pluginRegistry3);
        controller.getPortalPageContent(req, res);
    });

});
