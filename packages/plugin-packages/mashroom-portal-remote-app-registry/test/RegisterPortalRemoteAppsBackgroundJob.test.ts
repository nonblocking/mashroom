
import nock from 'nock';
import {loggingUtils} from '@mashroom/mashroom-utils';
import RegisterPortalRemoteAppsBackgroundJob from '../src/js/jobs/RegisterPortalRemoteAppsBackgroundJob';
import context from '../src/js/context';

import type {MashroomPluginDefinition} from '@mashroom/mashroom/type-definitions';
import type {RemotePortalAppEndpoint} from '../type-definitions';

describe('RegisterPortalRemoteAppsBackgroundJob', () => {

    const mockFindAll = jest.fn();
    const mockUpdateRemotePortalAppEndpoint = jest.fn();

    const pluginContextHolder: any = {
        getPluginContext: () => {
            return {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                serverConfig: {
                    externalPluginConfigFileNames: []
                },
                services: {
                    remotePortalAppEndpoint: {
                        service: {
                            findAll: mockFindAll,
                            updateRemotePortalAppEndpoint: mockUpdateRemotePortalAppEndpoint,
                        }
                    }
                }
            };
        }
    };

    const pluginDefinition: MashroomPluginDefinition = {
        name: 'Test App',
        description: 'Test App',
        type: 'portal-app2',
        clientBootstrap: 'startTestApp',
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
        local: {
            resourcesRoot: './dist',
            ssrBootstrap: './dist/renderToString.js'
        },
        remote: {
            resourcesRoot: '/public',
            ssrInitialHtmlPath: '/ssr'
        },
        defaultConfig: {
            title: {
                en: 'Title'
            },
            category: 'Test',
            tags: ['what', 'ever'],
            description: {
                en: 'The description'
            },
            metaInfo: {
                test: 1
            },
            caching: {
                ssrHtml: 'same-config-and-user'
            },
            editor: {
                editorPortalApp: 'Demo Config Editor',
                position: 'in-place',
                appConfig: {
                }
            },
            proxies: {
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

    const pluginDefinition2: MashroomPluginDefinition = {
        name: 'Test App No SSR',
        description: 'Test App No SSR',
        type: 'portal-app2',
        clientBootstrap: 'startTestApp2',
        resources: {
            js: [
                'bundle.js'
            ]
        },
        local: {
            resourcesRoot: './dist',
        },
        remote: {
            resourcesRoot: '/public',
        },
        defaultConfig: {
            title: {
                en: 'Title'
            },
            category: 'Test',
            appConfig: {
                customerId: '123123'
            }
        }
    };

    const pluginDefinitionV1: MashroomPluginDefinition = {
        name: 'Test App',
        description: 'Test App',
        tags: ['what', 'ever'],
        type: 'portal-app',
        category: 'Test',
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
    };

    const pluginPackageDefinition2: any = {
        plugins: [
            pluginDefinition,
            pluginDefinition2,
        ]
    };

    const pluginPackageDefinitionV1: any = {
        plugins: [
            pluginDefinitionV1,
        ]
    };

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

    beforeEach(() => {
       mockFindAll.mockReset();
    });

    it('scans an endpoint for Portal Apps', async () => {
        const endpoints: Array<RemotePortalAppEndpoint> = [{
            url: 'http://my-remote-app.io:6066',
            sessionOnly: false,
            lastError: null,
            retries: 0,
            registrationTimestamp: null,
            portalApps: [],
            invalidPortalApps: [],
        }];
        mockFindAll.mockReturnValue(endpoints);

        let updatedEndpoint: RemotePortalAppEndpoint | undefined;
        mockUpdateRemotePortalAppEndpoint.mockImplementation((e) => updatedEndpoint = e);

        nock('http://my-remote-app.io:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, -1, pluginContextHolder);

        await backgroundJob._processInBackground();

        expect(updatedEndpoint).toBeTruthy();
        expect(updatedEndpoint?.lastError).toBeFalsy();
        expect(updatedEndpoint?.portalApps.length).toBe(1);
        expect(updatedEndpoint?.portalApps[0].name).toBe('Test App');

        expect(context.registry.portalApps.length).toBe(1);
        context.registry.unregisterRemotePortalApp('Test App');
        expect(context.registry.portalApps.length).toBe(0);
    });

    it('processes duplicate Portal Apps correctly', async () => {
        const endpoints: Array<RemotePortalAppEndpoint> = [{
            url: 'http://my-remote-app.io:6066',
            sessionOnly: false,
            lastError: null,
            retries: 0,
            registrationTimestamp: null,
            portalApps: [],
            invalidPortalApps: [],
        }, {
            url: 'http://my-remote-app.com:6066',
            sessionOnly: false,
            lastError: null,
            retries: 0,
            registrationTimestamp: null,
            portalApps: [],
            invalidPortalApps: [],
        }];
        mockFindAll.mockReturnValue(endpoints);

        const updatedEndpoints: Array<RemotePortalAppEndpoint> = [];
        mockUpdateRemotePortalAppEndpoint.mockImplementation((e) => updatedEndpoints.push(e));

        nock('http://my-remote-app.io:6066')
            .get('/package.json')
            .reply(200, packageJson);
        nock('http://my-remote-app.com:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, -1, pluginContextHolder);

        await backgroundJob._processInBackground();

        expect(updatedEndpoints.length).toBe(2);
        expect(updatedEndpoints[0].portalApps.length).toBe(1);
        expect(updatedEndpoints[1].portalApps.length).toBe(0);
        expect(updatedEndpoints[1].invalidPortalApps.length).toBe(1);
        expect(updatedEndpoints[1].invalidPortalApps[0].error).toBe('Duplicate Portal App \'Test App\': The name is already defined on endpoint http://my-remote-app.io:6066/public');

        expect(context.registry.portalApps.length).toBe(1);

        context.registry.unregisterRemotePortalApp('Test App');
    });

    it('processes package.json correctly', () => {
        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, -1, pluginContextHolder);

        const {foundPortalApps} = backgroundJob.processPluginDefinition(packageJson, null, remotePortalAppEndpoint);

        expect(foundPortalApps).toBeTruthy();
        expect(foundPortalApps.length).toBe(1);

        const portalApp = foundPortalApps[0];
        expect(portalApp.lastReloadTs).toBeTruthy();
        expect(portalApp).toMatchObject({
            name: 'Test App',
            tags: ['what', 'ever'],
            title: {
                en: 'Title'
            },
            description: {
                en: 'The description',
            },
            version: '5.1.2',
            homepage: 'https://www.mashroom-server.com',
            author: 'juergen.kofler@nonblocking.at',
            license: 'MIT',
            category: 'Test',
            metaInfo: {
                test: 1
            },
            clientBootstrap: 'startTestApp',
            remoteApp: true,
            resourcesRootUri: 'https://www.mashroom-server.com/test-remote-app/public',
            ssrInitialHtmlUri: 'https://www.mashroom-server.com/test-remote-app/ssr',
            resources: {
                js: ['bundle.js']
            },
            sharedResources: {
                js: ['my-lib-dll-a1ef123a.js']
            },
            screenshots: ['assets/screenshot1.png', 'assets/screenshot2.png'],
            cachingConfig: {
                ssrHtml: 'same-config-and-user'
            },
            editorConfig: {
                editorPortalApp: 'Demo Config Editor',
                position: 'in-place',
                appConfig: {
                }
            },
            rolePermissions: {},
            proxies: {
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
        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, -1, pluginContextHolder);

        const {foundPortalApps} = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinition2, remotePortalAppEndpoint);

        expect(foundPortalApps).toBeTruthy();
        expect(foundPortalApps.length).toBe(2);

        const portalApp1 = foundPortalApps[0];
        expect(portalApp1.lastReloadTs).toBeTruthy();
        expect(portalApp1).toMatchObject({
            name: 'Test App',
            tags: ['what', 'ever'],
            title: {
                en: 'Title'
            },
            description: {
                en: 'The description',
            },
            version: '1.1.2',
            category: 'Test',
            metaInfo: {
                test: 1
            },
            clientBootstrap: 'startTestApp',
            remoteApp: true,
            resourcesRootUri: 'https://www.mashroom-server.com/test-remote-app/public',
            ssrInitialHtmlUri: 'https://www.mashroom-server.com/test-remote-app/ssr',
            resources: {
                js: ['bundle.js']
            },
            sharedResources: {
                js: ['my-lib-dll-a1ef123a.js']
            },
            screenshots: ['assets/screenshot1.png', 'assets/screenshot2.png'],
            cachingConfig: {
                ssrHtml: 'same-config-and-user'
            },
            editorConfig: {
                editorPortalApp: 'Demo Config Editor',
                position: 'in-place',
                appConfig: {
                }
            },
            rolePermissions: {},
            proxies: {
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

        const portalApp2 = foundPortalApps[1];
        expect(portalApp2.lastReloadTs).toBeTruthy();
        expect(portalApp2).toMatchObject({
            name: 'Test App No SSR',
            version: '1.1.2',
            clientBootstrap: 'startTestApp2',
            remoteApp: true,
            resourcesRootUri: 'https://www.mashroom-server.com/test-remote-app/public',
            ssrInitialHtmlUri: undefined,
            resources: {
                js: ['bundle.js']
            },
            proxies: {},
            defaultAppConfig: {
                customerId: '123123'
            }
        });
    });

    it('processes a portal-app config v2 correctly', () => {
        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, -1, pluginContextHolder);

        const {foundPortalApps} = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinition, remotePortalAppEndpoint);

        expect(foundPortalApps).toBeTruthy();
        expect(foundPortalApps.length).toBe(1);

        const portalApp = foundPortalApps[0];
        expect(portalApp.lastReloadTs).toBeTruthy();
        expect(portalApp).toMatchObject({
            name: 'Test App',
            tags: ['what', 'ever'],
            title: {
                en: 'Title'
            },
            description: {
                en: 'The description',
            },
            version: '1.1.2',
            category: 'Test',
            metaInfo: {
                test: 1
            },
            clientBootstrap: 'startTestApp',
            remoteApp: true,
            resourcesRootUri: 'https://www.mashroom-server.com/test-remote-app/public',
            ssrInitialHtmlUri: 'https://www.mashroom-server.com/test-remote-app/ssr',
            resources: {
                js: ['bundle.js']
            },
            sharedResources: {
                js: ['my-lib-dll-a1ef123a.js']
            },
            screenshots: ['assets/screenshot1.png', 'assets/screenshot2.png'],
            cachingConfig: {
                ssrHtml: 'same-config-and-user'
            },
            editorConfig: {
                editorPortalApp: 'Demo Config Editor',
                position: 'in-place',
                appConfig: {
                }
            },
            rolePermissions: {},
            proxies: {
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

    it('processes a portal-app config v1 correctly', () => {
        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, -1, pluginContextHolder);

        const {foundPortalApps} = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinitionV1, remotePortalAppEndpoint);

        expect(foundPortalApps).toBeTruthy();
        expect(foundPortalApps.length).toBe(1);

        const portalApp = foundPortalApps[0];
        expect(portalApp.lastReloadTs).toBeTruthy();
        expect(portalApp).toMatchObject({
            name: 'Test App',
            description: 'Test App',
            tags: ['what', 'ever'],
            title: {
                en: 'Title'
            },
            version: '1.1.2',
            category: 'Test',
            metaInfo: {
                test: 1
            },
            clientBootstrap: 'startTestApp',
            remoteApp: true,
            resourcesRootUri: 'https://www.mashroom-server.com/test-remote-app',
            resources: {
                js: ['bundle.js']
            },
            sharedResources: {
                js: ['my-lib-dll-a1ef123a.js']
            },
            screenshots: ['assets/screenshot1.png', 'assets/screenshot2.png'],
            rolePermissions: {},
            proxies: {
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

    it('handles timeouts correctly', async () => {
        const endpoints: Array<RemotePortalAppEndpoint> = [{
            url: 'http://my-remote-app.io:6066',
            sessionOnly: false,
            lastError: null,
            retries: 0,
            registrationTimestamp: null,
            portalApps: [],
            invalidPortalApps: [],
        }];
        mockFindAll.mockReturnValue(endpoints);

        let updatedEndpoint: RemotePortalAppEndpoint | undefined;
        mockUpdateRemotePortalAppEndpoint.mockImplementation((e) => updatedEndpoint = e);

        nock('http://my-remote-app.io:6066')
            .get('/package.json')
            .delayConnection(2000)
            .reply(200, packageJson);

        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(1, 10, -1, pluginContextHolder);

        await backgroundJob._processInBackground();

        expect(updatedEndpoint).toBeTruthy();
        expect(updatedEndpoint?.lastError).toBe('Timeout: Connection to http://my-remote-app.io:6066 timed out after 1sec');
    });
});
