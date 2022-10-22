
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
        expect(service.priority).toBe(1000);
        expect(service.status).toBe('Valid');

        expect(service.foundPortalApps.length).toBe(1);
        expect(service.foundPortalApps[0].name).toBe('Test App');

        context.registry.removeService(service.namespace, service.name);
        expect(context.registry.services.length).toBe(0);
    });

    it('scans a remote service in a namespace found via labelSelector', async () => {
        nock('http://my-remote-app.dev-namespace2:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(['environment=development'], null, undefined, '.*', 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.registry.services.length).toBe(1);

        const service = context.registry.services[0];
        expect(service.name).toBe('my-remote-app');
        expect(service.status).toBe('Valid');

        expect(service.foundPortalApps.length).toBe(1);
        expect(service.foundPortalApps[0].name).toBe('Test App');

        context.registry.removeService(service.namespace, service.name);
        expect(context.registry.services.length).toBe(0);
    });

    it('scans a remote service found via labelSelector', async () => {
        nock('http://my-remote-app.whata-namespace:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob('foo=bar', null, ['environment=dev'], undefined, 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.registry.services.length).toBe(1);

        const service = context.registry.services[0];
        expect(service.name).toBe('my-remote-app');
        expect(service.status).toBe('Valid');

        expect(service.foundPortalApps.length).toBe(1);
        expect(service.foundPortalApps[0].name).toBe('Test App');

        context.registry.removeService(service.namespace, service.name);
        expect(context.registry.services.length).toBe(0);
    });

    it('removes services that no longer exist', async () => {
        nock('http://my-remote-app.dev-namespace2:6066')
            .get('/package.json')
            .reply(200, packageJson);

        context.registry.addOrUpdateService({
            name: 'existing-service',
            namespace: 'dev-namespace2',
            url: 'foo',
            foundPortalApps: [],
            invalidPortalApps: [],
            error: null,
            status: 'Valid',
        } as any);

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['dev-namespace2'], undefined, '.*', 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.registry.services.length).toBe(1);
        const service = context.registry.services[0];
        context.registry.removeService(service.namespace, service.name);
    });

    it('processes duplicate Portal Apps correctly', async () => {
        nock('http://my-remote-app.dev-namespace3:6066')
            .get('/package.json')
            .reply(200, {
                ...packageJson,
                version: '6.0.0',
            });
        nock('http://my-remote-app.dev-namespace2:6066')
            .get('/package.json')
            .reply(200, packageJson);

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(['environment=development2', 'environment=development'], null, null, undefined, 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.registry.services.length).toBe(2);

        const service1 = context.registry.services[0];
        expect(service1.name).toBe('my-remote-app');
        expect(service1.status).toBe('Valid');

        expect(service1.foundPortalApps.length).toBe(1);
        expect(service1.foundPortalApps[0].name).toBe('Test App');

        const service2 = context.registry.services[1];
        expect(service2.name).toBe('my-remote-app');
        expect(service2.status).toBe('Valid');

        expect(service2.foundPortalApps.length).toBe(0);
        expect(service2.invalidPortalApps.length).toBe(1);
        expect(service2.invalidPortalApps[0].error).toBe('Duplicate Portal App \'Test App\': The name is already used by http://my-remote-app.dev-namespace3:6066 which has higher priority');
    });

    it('processes package.json correctly', () => {
        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['default'], undefined, '.*', 3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        const {foundPortalApps} = backgroundJob.processPluginDefinition(packageJson, null, {
            url: 'http://my-service.default:6789',
            name: 'my-service'
        } as any);
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
                en: 'The description'
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
            resourcesRootUri: 'http://my-service.default:6789/public',
            ssrInitialHtmlUri: 'http://my-service.default:6789/ssr',
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
            proxies: {
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

        const {foundPortalApps} = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinition2, {
            url: 'http://my-service.default:6789',
            name: 'my-service'
        } as any);
        expect(foundPortalApps).toBeTruthy();
        expect(foundPortalApps.length).toBe(2);

        const portalApp = foundPortalApps[0];
        expect(portalApp.lastReloadTs).toBeTruthy();
        expect(portalApp).toMatchObject({
            name: 'Test App',
            tags: ['what', 'ever'],
            title: {
                en: 'Title'
            },
            description: {
                en: 'The description'
            },
            version: '1.1.2',
            category: 'Test',
            metaInfo: {
                test: 1
            },
            clientBootstrap: 'startTestApp',
            resourcesRootUri: 'http://my-service.default:6789/public',
            ssrInitialHtmlUri: 'http://my-service.default:6789/ssr',
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
            proxies: {
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

        const portalApp2 = foundPortalApps[1];
        expect(portalApp2.lastReloadTs).toBeTruthy();
        expect(portalApp2).toMatchObject({
            name: 'Test App No SSR',
            version: '1.1.2',
            clientBootstrap: 'startTestApp2',
            remoteApp: true,
            resourcesRootUri: 'http://my-service.default:6789/public',
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

    it('processes a portal-app config v1 correctly', () => {
        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['default'], undefined, '.*',  3,
            300, false, [], new DummyKubernetesConnector(), dummyLoggerFactory);

        const {foundPortalApps} = backgroundJob.processPluginDefinition(packageJson2, pluginPackageDefinitionV1, {
            url: 'http://my-service.default:6789',
            name: 'my-service'
        } as any);
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
            proxies: {
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
