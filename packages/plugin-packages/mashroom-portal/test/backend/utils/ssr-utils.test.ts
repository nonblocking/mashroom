
import nock from 'nock';
import {loggingUtils} from '@mashroom/mashroom-utils';
import context, {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import {renderServerSide, renderInlineStyleForServerSideRenderedApps} from '../../../src/backend/utils/ssr-utils';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    authenticationExpiration: {
        warnBeforeExpirationSec: 60,
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
        cacheEnable: true,
        cacheTTLSec: 300,
        inlineStyles: true,
    }
});

describe('ssr-utils', () => {

    const portalApps = [
        {
            name: 'Test App 1',
            ssrBootstrap: `${__dirname}/ssr-bootstrap.js`,
            resourcesRootUri: `file://${__dirname}`,
            resources: {
                js: ['bundle.js'],
                css: ['style.css'],
            },
        },
        {
            name: 'Test App 2',
            ssrBootstrap: null,
        },
        {
            name: 'Test App 3',
            ssrInitialHtmlUri: 'http://localhost:1234/ssr-test',
        }
    ];

    portalApps.forEach((app) => context.pluginRegistry.registerPortalApp(app as any));

    const pluginContext: any = {
        loggerFactory: loggingUtils.dummyLoggerFactory,
        serverInfo: {
            devMode: false,
        },
        services: {
            portal: {
                service: {
                    getPortalApps() {
                        return portalApps;
                    }
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
                        };
                    },
                    isAdmin() {
                        return false;
                    }
                },
            },
            i18n: {
                service: {
                    getLanguage: () => 'en',
                    availableLanguages: ['en', 'fr', 'de'],
                }
            },
            memorycache: {
                service: {
                    get: (region: string, key: string) => {
                        if (key === '1318d1d2a4691f35774f0706ee0ed7c0979822dbcc7982deaee0b2f635a4e5e5') {
                            return 'content from cache';
                        }

                        return null;
                    },
                    set: () => { /* nothing to do */ },
                }
            }
        }
    };

    const noopRenderEmbeddedPortalAppsFn = async () => { throw new Error('Not implemented'); };

    it('returns null if the App has no SSR bootstrap', async () => {
        const portalAppSetup: any = {};
        const req: any  = {
            pluginContext,
        };
        const logger = loggingUtils.dummyLoggerFactory();
        const html = await renderServerSide('Test App 2', portalAppSetup, noopRenderEmbeddedPortalAppsFn, req, logger);
        expect(html).toBeFalsy();
    });

    it('returns the HTML from a local SSR bootstrap', async () => {
        const portalAppSetup: any = {};
        const req: any  = {
            pluginContext,
        };
        const logger = loggingUtils.dummyLoggerFactory();

        const html = await renderServerSide('Test App 1', portalAppSetup, noopRenderEmbeddedPortalAppsFn, req, logger);

        expect(html).toBeTruthy();
        expect(html).toEqual({embeddedPortalPageApps: {}, html: 'this is a test'});
    });

    it('returns the HTML from a remote SSR route', async () => {
        let body;

        nock('http://localhost:1234')
            .post('/ssr-test', (b) => { body = b; return true; })
            .reply(200, 'this is a remote test');

        const portalAppSetup: any = {
            theSetup: 1,
        };
        const req: any  = {
            path: '/the-path',
            query: {
                q: 'foo'
            },
            pluginContext,
        };
        const logger = loggingUtils.dummyLoggerFactory();

        const html = await renderServerSide('Test App 3', portalAppSetup, noopRenderEmbeddedPortalAppsFn, req, logger);

        expect(body).toEqual({
            originalRequest: {
                path: '/the-path',
                queryParameters: {
                    q: 'foo'
                }
            },
            portalAppSetup: {
                theSetup: 1,
            }
        });
        expect(html).toBeTruthy();
        expect(html).toEqual({embeddedPortalPageApps: {}, html: 'this is a remote test'});
    });

    it('returns the HTML a SSR bootstrap that embeds other Apps', async () => {
        nock('http://localhost:1234')
            .post('/ssr-test')
            .reply(200, {
                html: '<div><h1>Test Composite App</h1><div id="embedded-app-host"></div></div>',
                embeddedApps: [
                    {
                        pluginName: 'Test App 1',
                        appConfig: {},
                        appAreaId: 'embedded-app-host',
                    }
                ]
            }, { 'Content-Type': 'application/json'});

        const portalAppSetup: any = {};
        const req: any  = {
            pluginContext,
            params: {
                sitePath: 'foo',
            }
        };
        const logger = loggingUtils.dummyLoggerFactory();

        let hostHtml;
        let portalPageApps;
        const embeddedPortalAppsRenderer = async (html: string, apps: any) => {
            hostHtml = html;
            portalPageApps = apps;
            return {
                resultHtml: `<div>wooohooo</div>`,
                serverSideRenderedApps: [],
                embeddedPortalPageApps: {},
            };
        };

        const html = await renderServerSide('Test App 3', portalAppSetup, embeddedPortalAppsRenderer, req, logger);

        expect(html).toBeTruthy();
        expect(hostHtml).toBe('<div><h1>Test Composite App</h1><div id="embedded-app-host"></div></div>');
        expect(portalPageApps).toBeTruthy();
        // @ts-ignore
        expect(portalPageApps['embedded-app-host'].length).toBe(1);
        // @ts-ignore
        expect(portalPageApps['embedded-app-host'][0].instanceId).toContain('__ssr_embedded___');
    });

    it('returns null if the rendering takes too long', async () => {
        nock('http://localhost:1234')
            .post('/ssr-test')
            .delay(2500)
            .reply(200, 'this is a remote test');

        const portalAppSetup: any = {};
        const req: any  = {
            pluginContext,
        };
        const logger = loggingUtils.dummyLoggerFactory();
        const html = await renderServerSide('Test App 3', portalAppSetup, noopRenderEmbeddedPortalAppsFn, req, logger);
        expect(html).toBeFalsy();
    });

    it('returns the HTML from cache', async () => {
        const portalAppSetup: any = {
            appConfig: {
                cacheTest: 1,
            }
        };
        const req: any  = {
            pluginContext,
        };
        const logger = loggingUtils.dummyLoggerFactory();
        const html = await renderServerSide('Test App 3', portalAppSetup, noopRenderEmbeddedPortalAppsFn, req, logger);
        expect(html).toBeTruthy();
        expect(html).toEqual('content from cache');
    });

    it('renders the inline CSS styles', async () => {
        const req: any  = {
            pluginContext,
        };
        const logger = loggingUtils.dummyLoggerFactory();
        const result = await renderInlineStyleForServerSideRenderedApps(new Set(['Test App 1', 'Test App 3']), req, logger);
        expect(result).toBeTruthy();
        expect(result.headerContent).toBeTruthy();
        expect(result.headerContent).toContain('color: red;');
        expect(result.includedAppStyles).toEqual(['Test App 1']);
    });
});
