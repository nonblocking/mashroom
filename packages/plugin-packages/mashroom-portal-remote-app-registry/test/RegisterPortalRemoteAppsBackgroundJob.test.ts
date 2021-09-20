
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import RegisterPortalRemoteAppsBackgroundJob from '../src/js/jobs/RegisterPortalRemoteAppsBackgroundJob';

import type {MashroomPluginDefinition} from '@mashroom/mashroom/type-definitions';

describe('RegisterPortalRemoteAppsBackgroundJob', () => {

    const pluginContextHolder: any = {
        getPluginContext: () => {
            return {
                loggerFactory: dummyLoggerFactory,
                serverConfig: {
                    externalPluginConfigFileNames: []
                }
            }
        }
    };

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
                    sendPermissionsHeader: true
                },
                'two': {
                    targetUri: 'invalid-url-with-{env.PLACEHOLDER}',
                }
            },
            rolePermissions: {},
            appConfig: {
                customerId: '123123'
            }
        }
    };

    const pluginPackageDefinition: any = {
        plugins: [
            pluginDefinition,
        ]
    }

    const packageJson: any = {
        name: 'Test',
        version: '5.1.2',
        description: 'Test package',
        author: 'juergen.kofler@nonblocking.at',
        homepage: 'https://www.mashroom-server.com',
        license: 'MIT',
        mashroom: pluginPackageDefinition,
    };

    const packageJson2: any = {
        name: 'Test2',
        version: '1.1.2'
    };

    const remotePortalAppEndpoint: any = {
        url: 'https://www.mashroom-server.com/test-remote-app'
    };

    it('processes package.json correctly', () => {
        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, pluginContextHolder);

        const portalApps = backgroundJob.processPluginDefinition(packageJson, null, remotePortalAppEndpoint);

        expect(portalApps).toBeTruthy();
        expect(portalApps.length).toBe(1);

        const portalApp = portalApps[0];
        expect(portalApp.lastReloadTs).toBeTruthy();

        const fixedPortalApp = {...portalApp, lastReloadTs: 22};
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
            resourcesRootUri: 'https://www.mashroom-server.com/test-remote-app',
            resources: {
                js: ['bundle.js']
            },
            sharedResources: {
                js: ['my-lib-dll-a1ef123a.js']
            },
            screenshots: ['assets/screenshot1.png', 'assets/screenshot2.png'],
            rolePermissions: {},
            restProxies:
                {
                    bff: {
                        targetUri: 'https://www.mashroom-server.com/test-remote-app/api',
                        sendPermissionsHeader: true
                    },
                    two: {
                        targetUri: 'invalid-url-with-{env.PLACEHOLDER}',
                    }
                },
            defaultAppConfig: {
                customerId: '123123'
            }
        });
    });

    it('processes an external plugin package definition correctly', () => {
        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, pluginContextHolder);

        const portalApps = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinition, remotePortalAppEndpoint);

        expect(portalApps).toBeTruthy();
        expect(portalApps.length).toBe(1);

        const portalApp = portalApps[0];
        expect(portalApp.lastReloadTs).toBeTruthy();

        const fixedPortalApp = {...portalApp, lastReloadTs: 22};
        expect(fixedPortalApp).toEqual({
            name: 'Test App',
            description: 'Test App',
            tags: [],
            title: {
                en: 'Title'
            },
            version: '1.1.2',
            category: 'Test App',
            metaInfo: {
                test: 1
            },
            lastReloadTs: 22,
            globalLaunchFunction: 'startTestApp',
            resourcesRootUri: 'https://www.mashroom-server.com/test-remote-app',
            resources: {
                js: ['bundle.js']
            },
            sharedResources: {
                js: ['my-lib-dll-a1ef123a.js']
            },
            screenshots: ['assets/screenshot1.png', 'assets/screenshot2.png'],
            rolePermissions: {},
            restProxies:
                {
                    bff: {
                        targetUri: 'https://www.mashroom-server.com/test-remote-app/api',
                        sendPermissionsHeader: true
                    },
                    two: {
                        targetUri: 'invalid-url-with-{env.PLACEHOLDER}',
                    }
                },
            defaultAppConfig: {
                customerId: '123123'
            }
        });
    });

});
