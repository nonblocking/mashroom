
import MashroomPortalAppServiceImpl from '../../../src/frontend/portal-client/js/MashroomPortalAppServiceImpl';

describe('MashroomPortalAppServiceImpl', () => {

    const mockRemoteLogger: any = console;
    const mockRestService: any = {
        withBasePath: () => mockRestService,
    };
    let loadedScripts: Array<string> = [];
    let loadedStyles: Array<string> = [];
    const mockResourceManager: any = {
        loadJs: (js: string) => {
            loadedScripts.push(js);
            return Promise.resolve();
        },
        loadStyle: (style: string) => {
            loadedStyles.push(style);
            return Promise.resolve();
        }
    };

    beforeEach(() => {
        loadedScripts = [];
        loadedStyles = [];
    });

    // TODO: add more tests

    it('loads the Portal App resources in the correct order', async () => {

        const portalAppService = new MashroomPortalAppServiceImpl(mockRestService, mockResourceManager, mockRemoteLogger);

        const portalApp = {
            appSetup: {
                sharedResourcesBasePath: 'http://localhost:5050/shared',
                sharedResources: {
                    js: ['shared1.js', 'shared2.js'],
                    css: ['shared-style.css'],
                },
                resourcesBasePath: 'http://localhost:5050/app1',
                resources: {
                    js: ['bundle1.js', 'bundle2.js'],
                    css: ['style.css'],
                },
            }
        };

        // @ts-ignore
        await portalAppService._loadResources(portalApp);

        expect(loadedScripts.length).toBe(4);
        expect(loadedScripts).toEqual([
            'http://localhost:5050/shared/js/shared1.js',
            'http://localhost:5050/shared/js/shared2.js',
            'http://localhost:5050/app1/bundle1.js?v=undefined',
            'http://localhost:5050/app1/bundle2.js?v=undefined',
        ]);
        expect(loadedStyles.length).toBe(2);
        expect(loadedStyles).toEqual([
            'http://localhost:5050/shared/css/xshared-style.css',
            'http://localhost:5050/app1/style.css?v=undefined',
        ]);
    });

});
