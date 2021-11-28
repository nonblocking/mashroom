
import nock from 'nock';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
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
                loggerFactory: dummyLoggerFactory,
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
            }
        }
    };

    const pluginDefinition: MashroomPluginDefinition = {
        name: 'Test App',
        description: 'Test App',
        type: 'portal-app',
        category: 'Test App',
        clientBootstrap: 'startTestApp',
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
        local: {
            resourcesRoot: './dist',
            ssrBootstrap: 'renderToString.js'
        },
        remote: {
            resourcesRoot: '/public',
            ssrInitialHtmlPath: '/ssr'
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
        defaultConfig: {
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
            metaInfo: {
                test: 1
            },
            appConfig: {
                customerId: '123123'
            }
        }
    };

    const pluginDefinitionV1: MashroomPluginDefinition = {
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

    const pluginPackageDefinitionV1: any = {
        plugins: [
            pluginDefinitionV1,
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

    beforeEach(() => {
       mockFindAll.mockReset();
    });

    it('scans a remote service', async () => {

        const endpoints: Array<RemotePortalAppEndpoint> = [{
            url: 'http://my-remote-app.io:6066',
            sessionOnly: false,
            lastError: null,
            retries: 0,
            registrationTimestamp: null,
            portalApps: [],
        }];
        mockFindAll.mockReturnValue(endpoints);

        let updatedEndpoint: RemotePortalAppEndpoint | undefined;
        mockUpdateRemotePortalAppEndpoint.mockImplementation((e) => updatedEndpoint = e);

        nock('http://my-remote-app.io:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, pluginContextHolder);

        await backgroundJob._processInBackground();

        expect(updatedEndpoint).toBeTruthy();
        expect(updatedEndpoint?.lastError).toBeFalsy();
        expect(updatedEndpoint?.portalApps.length).toBe(1);
        expect(updatedEndpoint?.portalApps[0].name).toBe('Test App');

        expect(context.registry.portalApps.length).toBe(1);
        context.registry.unregisterRemotePortalApp('Test App');
        expect(context.registry.portalApps.length).toBe(0);
    });

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
            proxies:
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
            proxies:
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

    it('processes a portal-app config v2 correctly', () => {
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
            proxies:
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

    it('processes a portal-app config v1 correctly', () => {
        const backgroundJob = new RegisterPortalRemoteAppsBackgroundJob(3, 10, pluginContextHolder);

        const portalApps = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinitionV1, remotePortalAppEndpoint);

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
            proxies:
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
