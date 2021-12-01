
import nock from 'nock';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import {renderServerSide, renderInlineStyleForServerSideRenderedApps} from '../../../src/backend/utils/ssr_utils';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    warnBeforeAuthenticationExpiresSec: 120,
    autoExtendAuthentication: false,
    defaultProxyConfig: {},
    sslConfig: {
        sslEnabled: true,
        renderTimoutMs: 2000,
        cacheTTLSec: 300,
        inlineStyles: true,
    }
});

describe('ssr_utils', () => {

    const pluginContext: any = {
        loggerFactory: dummyLoggerFactory,
        services: {
            portal: {
                service: {
                    getPortalApps() {
                        return [
                            {
                                name: 'Test App 1',
                                ssrBootstrap: `${__dirname}/ssr_bootstrap.js`,
                                resourcesRootUri: `file:/${__dirname}`,
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
                        ]
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
                },
            },
            memorycache: {
                service: {
                    get: (region: string, key: string) => {
                        if (key === 'eyJjYWNoZVRlc3QiOjF9X3Rlc3Q=') {
                            return 'content from cache';
                        }

                        return null;
                    },
                    set: () => { /* nothing to do */ },
                }
            }
        }
    };

    it('returns null if the App has no SSR bootstrap', async () => {
        const portalAppSetup: any = {};
        const req: any  = {
            pluginContext,
        }
        const logger = dummyLoggerFactory();
        const html = await renderServerSide('Test App 2', portalAppSetup, req, logger);
        expect(html).toBeFalsy();
    });

    it('returns the HTML from a local SSR bootstrap', async () => {
        const portalAppSetup: any = {};
        const req: any  = {
            pluginContext,
        }
        const logger = dummyLoggerFactory();
        const html = await renderServerSide('Test App 1', portalAppSetup, req, logger);
        expect(html).toBeTruthy();
        expect(html).toEqual('this is a test');
    });

    it('returns the HTML from a remote SSR route', async () => {
        nock('http://localhost:1234')
            .post('/ssr-test')
            .reply(200, 'this is a remote test');

        const portalAppSetup: any = {};
        const req: any  = {
            pluginContext,
        }
        const logger = dummyLoggerFactory();
        const html = await renderServerSide('Test App 3', portalAppSetup, req, logger);
        expect(html).toBeTruthy();
        expect(html).toEqual('this is a remote test');
    });

    it('returns null if the rendering takes too long', async () => {
        nock('http://localhost:1234')
            .post('/ssr-test')
            .delay(2500)
            .reply(200, 'this is a remote test');

        const portalAppSetup: any = {};
        const req: any  = {
            pluginContext,
        }
        const logger = dummyLoggerFactory();
        const html = await renderServerSide('Test App 3', portalAppSetup, req, logger);
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
        }
        const logger = dummyLoggerFactory();
        const html = await renderServerSide('Test App 3', portalAppSetup, req, logger);
        expect(html).toBeTruthy();
        expect(html).toEqual('content from cache');
    });

    it('renders the inline CSS styles', async () => {
        const req: any  = {
            pluginContext,
        }
        const logger = dummyLoggerFactory();
        const result = await renderInlineStyleForServerSideRenderedApps(['Test App 1', 'Test App 3'], req, logger);
        expect(result).toBeTruthy();
        expect(result.headerContent).toBeTruthy();
        expect(result.headerContent).toContain('color: red;');
        expect(result.includedAppStyles).toEqual(['Test App 1']);
    });
});
