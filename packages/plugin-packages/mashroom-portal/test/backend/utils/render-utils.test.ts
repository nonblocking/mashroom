
import {loggingUtils} from '@mashroom/mashroom-utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import {renderContent} from '../../../src/backend/utils/render-utils';
import type {MashroomPortalPageApps} from '../../../type-definitions/internal';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    warnBeforeAuthenticationExpiresSec: 120,
    autoExtendAuthentication: false,
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

describe('path-utils', () => {

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
        const appInfo: MashroomPortalPageApps = {
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

        const result = await renderContent(layout, appInfo, false, () => { /* nothing to do */ }, (key) => key, req, res, logger);

        expect(result).toBeTruthy();
        expect(result.resultHtml).toContain('data-mr-app-id="app1"');
        expect(result.resultHtml).toContain('data-mr-app-id="app2"');
        expect(result.resultHtml).toContain('data-mr-app-id="app3"');

        expect(result.resultHtml.search(/id="app-area1">[\s\S]*<div data-mr-app-id="app1"/) > 0).toBeTruthy();
        expect(result.resultHtml.search(/id="app-area2">[\s\S]*<div data-mr-app-id="app2"/) > 0).toBeTruthy();

        expect(result.serverSideRenderedApps).toEqual(['App 1']);
    });

});
