import mapPortalAppSetupToOpenMicrofrontendsContext from '../../src/app-enhancement/mapPortalAppSetupToOpenMicrofrontendsContext';
import type {MashroomPortalAppSetup} from '@mashroom/mashroom-portal/type-definitions';

describe('mapPortalAppSetupToOpenMicrofrontendsContext', () => {

    it('maps an portalAppSetup for an OpenMicrofrontend', () => {

        const appSetup: MashroomPortalAppSetup = {
            appId: '123',
            instanceId: undefined,
            pluginName: 'My First Microfrontend',
            title: 'My First Microfrontend',
            version: '1.0.1',
            lastReloadTs: Date.now(),
            serverSideRendered: false,
            versionHash: 'sdfsdfdsfsdf',
            proxyPaths: {
                __baseUrl: '/proxies',
                proxy1: '/proxies/proxy1',
                proxy2: '/proxies/proxy2',
            },
            restProxyPaths: {
                __baseUrl: '/proxies',
            },
            sharedResourcesBasePath: '/public',
            sharedResources: undefined,
            resourcesBasePath: '/public',
            resources: {
                moduleSystem: 'ESM',
                importMap: {
                    imports: {
                        externalModule1: 'https://ga.jspm.io/npm:externalModule1@1.2.2/index.js',
                        externalModule2: 'https://ga.jspm.io/npm:externalModule2@5.1.8/index.js'
                    }
                },
                js: [
                    'Microfrontend.js'
                ],
                css: [
                    'styles.css'
                ],
            },
            clientBootstrapName: 'startMyFirstMicrofrontend',
            lang: 'en',
            user: {
                username: 'disastermaster',
                displayName: 'Disaster Master',
                guest: false,
                email: null,
                permissions: {
                    deleteCustomer: false,
                }
            },
            appConfig: {
                customerId: '1000'
            },
            editorConfig: undefined,
        };

        const result = mapPortalAppSetupToOpenMicrofrontendsContext(appSetup);

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: '123',
            lang: 'en',
            user: {
                displayName: 'Disaster Master',
                username: 'disastermaster'
            },
            permissions: {
                deleteCustomer: false
            },
            apiProxyPaths: {
                __baseUrl: '/proxies',
                proxy1: '/proxies/proxy1',
                proxy2: '/proxies/proxy2'
            },
            serverSideRendered: false,
            config: {
                customerId: '1000'
            },
            hostContext: {
                hostApplicationName: 'Mashroom Portal',
                openMicrofrontends: true,
            },
        });
    });

});
