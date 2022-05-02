
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import {
    renderPageContent
} from '../../../src/backend/utils/render_utils';
import type {MashroomPortalPageApps} from '../../../type-definitions/internal';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    warnBeforeAuthenticationExpiresSec: 120,
    autoExtendAuthentication: false,
    ignoreMissingAppsOnPages: false,
    defaultProxyConfig: {},
    ssrConfig: {
        ssrEnable: true,
        renderTimoutMs: 500,
        cacheEnable: false,
        cacheTTLSec: 300,
        inlineStyles: true,
    }
});

describe('path_utils', () => {

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
                        title: 'App 1',
                    } as any
                },
                {
                    pluginName: 'App 3',
                    instanceId: '3',
                    appSetup: {
                        appId: 'app3',
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
                        title: 'App 2',
                    } as any
                }
            ]
        };
        const pluginContext: any = {
            loggerFactory: dummyLoggerFactory,
            services: {
                portal: {
                    service: {
                        getPortalApps() {
                            return [
                                {
                                    name: 'App 1',
                                    ssrBootstrap: `${__dirname}/ssr_bootstrap.js`,
                                },
                            ]
                        }
                    },
                }
            }
        };
        const req: any = {
            pluginContext,
        };
        const res: any = {};
        const logger = dummyLoggerFactory();

        const result = await renderPageContent(layout, appInfo, false, (key) => key, req, res, logger);

        // console.info('!!!', content);

        expect(result).toBeTruthy();
        expect(result.pageContent).toContain('data-mr-app-id="app1"');
        expect(result.pageContent).toContain('data-mr-app-id="app2"');
        expect(result.pageContent).toContain('data-mr-app-id="app3"');

        expect(result.pageContent.search(/id="app-area1">[\s\S]*<div data-mr-app-id="app1"/) > 0).toBeTruthy();
        expect(result.pageContent.search(/id="app-area2">[\s\S]*<div data-mr-app-id="app2"/) > 0).toBeTruthy();

        expect(result.serverSideRenderedApps).toEqual(['App 1']);
    });

});
