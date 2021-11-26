
import nock from 'nock';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import ScanK8SPortalRemoteAppsBackgroundJob from '../src/js/jobs/ScanK8SPortalRemoteAppsBackgroundJob';
import DummyKubernetesConnector from '../src/js/k8s/DummyKubernetesConnector';
import context from '../src/js/context';

import type {MashroomPluginDefinition} from '@mashroom/mashroom/type-definitions';

describe('ScanK8SPortalRemoteAppsBackgroundJob', () => {

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

    it('scans a remote service', async () => {
        nock('http://my-remote-app.dev-namespace2:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['dev-namespace2'], undefined, '.*', 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.registry.services.length).toBe(1);

        const service = context.registry.services[0];
        expect(service.name).toBe('my-remote-app');
        expect(service.status).toBe('Valid');

        expect(service.foundPortalApps.length).toBe(1);
        expect(service.foundPortalApps[0].name).toBe('Test App');

        context.registry.removeService('my-remote-app');
        expect(context.registry.services.length).toBe(0);
    });

    it('scans a remote service in a namespace found via labelSelector', async () => {
        nock('http://my-remote-app.dev-namespace2:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob('environment=development', null, undefined, '.*', 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.registry.services.length).toBe(1);

        const service = context.registry.services[0];
        expect(service.name).toBe('my-remote-app');
        expect(service.status).toBe('Valid');

        expect(service.foundPortalApps.length).toBe(1);
        expect(service.foundPortalApps[0].name).toBe('Test App');

        context.registry.removeService('my-remote-app');
        expect(context.registry.services.length).toBe(0);
    });

    it('scans a remote service found via labelSelector', async () => {
        nock('http://my-remote-app.whata-namespace:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob('foo=bar', null, 'environment=dev', undefined, 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.registry.services.length).toBe(1);

        const service = context.registry.services[0];
        expect(service.name).toBe('my-remote-app');
        expect(service.status).toBe('Valid');

        expect(service.foundPortalApps.length).toBe(1);
        expect(service.foundPortalApps[0].name).toBe('Test App');

        context.registry.removeService('my-remote-app');
        expect(context.registry.services.length).toBe(0);
    });

    it('processes package.json correctly', () => {
        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['default'], undefined, '.*', 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        const portalApps = backgroundJob.processPluginDefinition(packageJson, null, {
            url: 'http://my-service.default:6789',
            name: 'my-service'
        } as any);
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
            resourcesRootUri: 'http://my-service.default:6789/public',
            ssrInitialHtmlPath: 'http://my-service.default:6789/ssr',
            remoteApp: true,
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
                        targetUri: 'http://my-service.default:6789/api',
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
        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['default'], undefined, '.*',  3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        const portalApps = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinition, {
            url: 'http://my-service.default:6789',
            name: 'my-service'
        } as any);
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
            resourcesRootUri: 'http://my-service.default:6789/public',
            ssrInitialHtmlPath: 'http://my-service.default:6789/ssr',
            remoteApp: true,
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
                        targetUri: 'http://my-service.default:6789/api',
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
        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['default'], undefined, '.*',  3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        const portalApps = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinitionV1, {
            url: 'http://my-service.default:6789',
            name: 'my-service'
        } as any);
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
            resourcesRootUri: 'http://my-service.default:6789',
            remoteApp: true,
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
                        targetUri: 'http://my-service.default:6789/api',
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
