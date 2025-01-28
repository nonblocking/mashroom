
import {loggingUtils} from '@mashroom/mashroom-utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import {renderContent, renderAppWrapper} from '../../../src/backend/utils/render-utils';
import type {MashroomPortalPageApps} from '../../../type-definitions/internal';
import type {MashroomPortalAppWrapperRenderModel} from "../../../type-definitions";

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

describe('render-utils', () => {

    it('renders the page content', async () => {
        const layout = `
            <div class="row">
                <div class="col-md-6 mashroom-portal-app-area" id="app-area1">
                    <!-- Portal apps go here -->
                </div>
                <div class="col-md-6 mashroom-portal-app-area" id="app-area2">
                    <!-- Portal apps go here -->
                </div>
            </div>
        `;
        const portalApps: MashroomPortalPageApps = {
            'app-area1': [
                {
                    pluginName: 'App 1',
                    instanceId: '1',
                    appSetup: {
                        appId: 'app1',
                        pluginName: 'App 1',
                        title: 'App 1',
                    } as any
                },
                {
                    pluginName: 'App 3',
                    instanceId: '3',
                    appSetup: {
                        appId: 'app3',
                        pluginName: 'App 3',
                        title: 'App 3',
                    } as any
                }
            ],
            'app-area2': [
                {
                    pluginName: 'App 2',
                    instanceId: '2',
                    appSetup: {
                        appId: 'app2',
                        pluginName: 'App 2',
                        title: 'App 2',
                    } as any
                }
            ]
        };
        const pluginContext: any = {
            loggerFactory: loggingUtils.dummyLoggerFactory,
            services: {
                portal: {
                    service: {
                        getPortalApps() {
                            return [
                                {
                                    name: 'App 1',
                                    ssrBootstrap: `${__dirname}/ssr-bootstrap.js`,
                                },
                            ];
                        }
                    },
                }
            },
            serverInfo: {
                devMode: false,
            },
        };
        const req: any = {
            pluginContext,
        };
        const res: any = {};
        const logger = loggingUtils.dummyLoggerFactory();

        const result = await renderContent(layout, portalApps, false, () => { /* nothing to do */ }, (key) => key, req, res, logger);

        expect(result).toBeTruthy();
        expect(result.resultHtml).toContain('data-mr-app-id="app1"');
        expect(result.resultHtml).toContain('data-mr-app-id="app2"');
        expect(result.resultHtml).toContain('data-mr-app-id="app3"');

        expect(result.resultHtml.search(/id="app-area1">[\s\S]*<div data-mr-app-id="app1"/) > 0).toBeTruthy();
        expect(result.resultHtml.search(/id="app-area2">[\s\S]*<div data-mr-app-id="app2"/) > 0).toBeTruthy();

        expect(result.serverSideRenderedApps.values().toArray()).toEqual(['App 1']);
        expect(portalApps['app-area1'][0].appSetup.serverSideRendered).toBeTruthy();
        expect(portalApps['app-area1'][1].appSetup.serverSideRendered).toBeFalsy();
    });

    it('renders the app wrapper', async () => {
        const req: any = {};
        const res: any = {};

        const model: MashroomPortalAppWrapperRenderModel = {
            appId: '1',
            pluginName: 'Plugin 1',
            safePluginName: 'Plugin 1',
            title: 'Test',
            appSSRHtml: '<div>this is the app content</div>',
            messages: (key) => key,
        };

        const html = await renderAppWrapper(false, () => {}, model, req, res, loggingUtils.dummyLoggerFactory());

        expect(html).toBeTruthy();

        expect(html).toBe(`
    <div data-mr-app-id="1" data-mr-app-name="Plugin 1" class="mashroom-portal-app-wrapper portal-app-Plugin 1">
        <div class="mashroom-portal-app-header">
            <div data-mr-app-content="title" class="mashroom-portal-app-header-title">Test</div>
        </div>
        <div data-mr-app-content="app" class="mashroom-portal-app-host"><div>this is the app content</div></div>
    </div>
`);
    });
});
