// @ts-ignore
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import ScanK8SPortalRemoteAppsBackgroundJob from '../src/js/jobs/ScanK8SPortalRemoteAppsBackgroundJob';
import DummyKubernetesConnector from '../src/js/k8s/DummyKubernetesConnector';

import {MashroomPluginDefinition} from '@mashroom/mashroom/type-definitions';

describe('ScanK8SPortalRemoteAppsBackgroundJob', () => {

    const pluginDefinition: MashroomPluginDefinition = {
        name: 'Test App',
        description: 'Test App',
        type: 'portal-app',
        category: 'Test App',
        bootstrap: 'startTestApp',
        title: {
            en: 'Title'
        },
        sharedResources: {
            js: [
                'my-lib-dll-a1ef123a.js'
            ]
        },
        resources: {
            js: [
                'bundle.js'
            ]
        },
        screenshots: [
            'assets/screenshot1.png',
            'assets/screenshot2.png'
        ],
        requires: [],
        defaultConfig: {
            metaInfo: {
                test: 1
            },
            resourcesRoot: './dist/frontend',
            restProxies: {
                'bff': {
                    targetUri: 'http://localhost:4444/api',
                    sendUserHeader: true,
                    sendPermissionsHeader: true
                }
            },
            rolePermissions: {},
            appConfig: {
                customerId: '123123'
            }
        }
    };

    const packageJson: any = {
        name: 'Test',
        version: '5.1.2',
        description: 'Test package',
        author: 'juergen.kofler@nonblocking.at',
        homepage: 'https://www.mashroom-server.com',
        license: 'MIT',
        mashroom: {
            plugins: [
                pluginDefinition
            ]
        }
    };

    it('processes the package json correctly', () => {
        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(['default'], '.*', 3,
            300, false, new DummyKubernetesConnector(), dummyLoggerFactory);

        const portalApps = backgroundJob.processPackageJson(packageJson, 'http://my-service.default:6789', 'my-service');
        expect(portalApps).toBeTruthy();
        expect(portalApps.length).toBe(1);

        const portalApp = portalApps[0];
        expect(portalApp.lastReloadTs).toBeTruthy();
        const fixedPortalApp = Object.assign({}, portalApp, {
            lastReloadTs: 22
        });
        expect(fixedPortalApp).toEqual({
            name: 'Test App',
            description: 'Test App',
            tags: [],
            title: {
                en: 'Title'
            },
            version: '5.1.2',
            homepage: 'https://www.mashroom-server.com',
            author: 'juergen.kofler@nonblocking.at',
            license: 'MIT',
            category: 'Test App',
            metaInfo: {
                test: 1
            },
            lastReloadTs: 22,
            globalLaunchFunction: 'startTestApp',
            resourcesRootUri: 'http://my-service.default:6789',
            resources: {
                js: ['bundle.js'],
                css: undefined
            },
            sharedResources: {
                js: ['my-lib-dll-a1ef123a.js'],
                css: undefined
            },
            screenshots: ['assets/screenshot1.png', 'assets/screenshot2.png'],
            defaultRestrictViewToRoles: undefined,
            rolePermissions: {},
            restProxies:
                {
                    bff:
                        {
                            targetUri: 'http://my-service.default:6789/api',
                            sendUserHeader: true,
                            sendPermissionsHeader: true
                        }
                },
            defaultAppConfig: {
                customerId: '123123'
            }
        });
    });

});
