
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {
    renderPageContent
} from '../../../src/backend/utils/render_utils';
import type {MashroomPortalPageAppsInfo} from '../../../type-definitions/internal';

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
        const appInfo: MashroomPortalPageAppsInfo = {
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
        const req: any = {};
        const res: any = {};
        const logger = dummyLoggerFactory();

        const content = await renderPageContent(layout, appInfo, false, (key) => key, req, res, logger);

        // console.info('!!!', content);

        expect(content).toBeTruthy();
        expect(content).toContain('data-mr-app-id="app1"');
        expect(content).toContain('data-mr-app-id="app2"');
        expect(content).toContain('data-mr-app-id="app3"');

        expect(content.search(/id="app-area1">[\s\S]*<div data-mr-app-id="app1"/) > 0).toBeTruthy();
        expect(content.search(/id="app-area2">[\s\S]*<div data-mr-app-id="app2"/) > 0).toBeTruthy();
    });



});