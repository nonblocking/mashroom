import {loggingUtils} from '@mashroom/mashroom-utils';
import KubernetesRemotePluginPackagesScanner from '../../src/js/scanner/KubernetesRemotePluginPackagesScanner';
import context from '../../src/js/context';

const scannerCallback = {
    addOrUpdatePackageURL: jest.fn(),
    removePackageURL: jest.fn()
};
context.scannerCallback = scannerCallback;

const mockKubernetesConnector = {
    watchNamespaces: jest.fn(),
    watchServices: jest.fn(),
    watchPods: jest.fn(),
};

describe('KubernetesRemotePluginPackagesScanner', () => {

    beforeEach(() => {
        context.watchedNamespaces = [];
        context.services = [{
            name: 'existing-service',
            uid: '1212323',
        } as any];
        context.runningPods = [{
            name: 'existing-pod',
            uid: '222222',
            labels: [],
        } as any];
        scannerCallback.addOrUpdatePackageURL.mockReset();
        scannerCallback.removePackageURL.mockReset();
        mockKubernetesConnector.watchNamespaces.mockReset();
        mockKubernetesConnector.watchServices.mockReset();
        mockKubernetesConnector.watchPods.mockReset();
    });

    it('watches services and pods in a given list of namespaces', async () => {

        mockKubernetesConnector.watchServices.mockImplementation(async (namespace, labelSelector, cb) => {
            cb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'my-remote-app',
                    namespace: 'dev-namespace2',
                    annotations: {
                        'mashroom-server.com/remote-plugins': 'true',
                        'mashroom-server.com/remote-plugins-definition-path': '/mashroom.json'
                    }
                },
                spec: {
                    selector: {
                      app: 'my-remote-app',
                    },
                    clusterIP: '127.0.0.1',
                    ports: [
                        {
                            targetPort: 8080,
                            port: 6066
                        }
                    ]
                }
            });
        });
        mockKubernetesConnector.watchPods.mockImplementation(async (namespace, cb) => {
            cb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'pod1',
                    namespace: 'dev-namespace2',
                    labels: {
                      app: 'my-remote-app',
                    }
                },
                spec: {
                    containers: [{
                        name: 'foo',
                        image: 'foo:1.0.0',
                        ports: [{
                            containerPort: 8080
                        }]
                    }]
                },
                status: {
                    phase: 'Running'
                }
            });
        });

        const scanner = new KubernetesRemotePluginPackagesScanner(null, ['dev-namespace2'], undefined, '.*',
            mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await scanner.start();

        expect(context.services.length).toBe(2);

        const service = context.services[1];
        expect(service.namespace).toBe('dev-namespace2');
        expect(service.name).toBe('my-remote-app');
        expect(service.error).toBeFalsy();

        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(1);
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[0][0].toString()).toBe('http://my-remote-app.dev-namespace2:6066/');
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[0][1]).toEqual({
            packageName: 'my-remote-app',
            packageVersion: '1.0.0',
            'mashroom-server.com/remote-plugins': 'true',
            'mashroom-server.com/remote-plugins-definition-path': '/mashroom.json'
        });
        expect(mockKubernetesConnector.watchNamespaces).toHaveBeenCalledTimes(0);
        expect(mockKubernetesConnector.watchServices).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.watchServices.mock.calls[0][0]).toBe('dev-namespace2');
    });

    it('watches services and pods in namespaces found via labelSelector', async () => {

        mockKubernetesConnector.watchNamespaces.mockImplementation(async (labelSelector, cb) => {
            cb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'dev-namespace1',
                    labels: {
                        environment: 'development'
                    },
                },
            });
            cb('ADDED', {
                metadata: {
                    uid: '2',
                    name: 'dev-namespace2',
                    labels: {
                        environment: 'development'
                    },
                },
            });
        });
        mockKubernetesConnector.watchServices.mockImplementation(async (namespace, labelSelector, cb) => {
            if (namespace === 'dev-namespace2') {
                cb('ADDED', {
                    metadata: {
                        uid: '1',
                        name: 'my-remote-app',
                        namespace: 'dev-namespace2',
                    },
                    spec: {
                        selector: {
                            app: 'my-remote-app',
                        },
                        clusterIP: '127.0.0.1',
                        ports: [
                            {
                                targetPort: 8080,
                                port: 6066
                            }
                        ]
                    }
                });
            }
        });
        mockKubernetesConnector.watchPods.mockImplementation(async (namespace, cb) => {
            cb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'pod1',
                    namespace: 'dev-namespace2',
                    labels: {
                        app: 'my-remote-app',
                    }
                },
                spec: {
                    containers: [{
                        name: 'foo',
                        image: 'foo:1.0.0',
                        ports: [{
                            containerPort: 8080
                        }]
                    }]
                },
                status: {
                    phase: 'Running'
                }
            });
        });

        const scanner = new KubernetesRemotePluginPackagesScanner(['environment=development'], null, undefined, '.*',
            mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await scanner.start();

        expect(context.services.length).toBe(2);

        const service = context.services[1];
        expect(service.namespace).toBe('dev-namespace2');
        expect(service.name).toBe('my-remote-app');
        expect(service.error).toBeFalsy();

        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(1);
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[0][0].toString()).toBe('http://my-remote-app.dev-namespace2:6066/');
        expect(mockKubernetesConnector.watchNamespaces).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.watchNamespaces.mock.calls[0][0]).toBe('environment=development');
        expect(mockKubernetesConnector.watchServices).toHaveBeenCalledTimes(2);
        expect(mockKubernetesConnector.watchServices.mock.calls[0][0]).toBe('dev-namespace1');
        expect(mockKubernetesConnector.watchServices.mock.calls[1][0]).toBe('dev-namespace2');
    });

    it('watches services with a labelSelector', async () => {

        mockKubernetesConnector.watchNamespaces.mockImplementation(async (labelSelector, cb) => {
            cb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'dev-namespace1',
                    labels: {
                        environment: 'development'
                    },
                },
            });
        });
        mockKubernetesConnector.watchServices.mockImplementation(async (namespace, labelSelector, cb) => {
            cb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'my-remote-app',
                    namespace: 'dev-namespace1',
                },
                spec: {
                    selector: {
                        app: 'my-remote-app',
                    },
                    clusterIP: '127.0.0.1',
                    ports: [
                        {
                            targetPort: 8080,
                            port: 6066
                        }
                    ]
                }
            });
        });
        mockKubernetesConnector.watchPods.mockImplementation(async (namespace, cb) => {
            cb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'pod1',
                    namespace: 'dev-namespace2',
                    labels: {
                        app: 'my-remote-app',
                    }
                },
                spec: {
                    containers: [{
                        name: 'foo',
                        image: 'foo:1.0.0',
                        ports: [{
                            containerPort: 8080
                        }]
                    }]
                },
                status: {
                    phase: 'Running'
                }
            });
        });

        const scanner = new KubernetesRemotePluginPackagesScanner('foo=bar', null, ['environment=dev'], undefined,
            mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await scanner.start();

        expect(context.services.length).toBe(2);

        const service = context.services[1];
        expect(service.namespace).toBe('dev-namespace1');
        expect(service.name).toBe('my-remote-app');

        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.watchNamespaces).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.watchNamespaces.mock.calls[0][0]).toBe('foo=bar');
        expect(mockKubernetesConnector.watchServices).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.watchServices.mock.calls[0][0]).toBe('dev-namespace1');
        expect(mockKubernetesConnector.watchServices.mock.calls[0][1]).toBe('environment=dev');
    });

    it('removes the plugin package if a service gets deleted', async () => {

        mockKubernetesConnector.watchServices.mockImplementation(async (namespace, labelSelector, cb) => {
            cb('DELETED', {
                metadata: {
                    uid: '1',
                    name: 'my-remote-app',
                    namespace: 'dev-namespace1',
                },
                spec: {
                    selector: {
                        app: 'my-remote-app',
                    },
                    clusterIP: '127.0.0.1',
                    ports: [
                        {
                            targetPort: 8080,
                            port: 6066
                        }
                    ]
                }
            });
        });

        context.services.push({
            uid: '1',
            name: 'my-remote-app',
            namespace: 'dev-namespace1',
            annotations: {},
            targetPort: '8088',
            url: new URL('http://my-remote-app.dev-namespace1:6066'),
            selector: {},
            error: null,
            lastModified: 0,
            firstSeen: 0,
            imageVersion: undefined,
            runningPods: 0,
        });

        const scanner = new KubernetesRemotePluginPackagesScanner(null, ['dev-namespace2'], undefined, '.*',
            mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await scanner.start();

        expect(context.services.length).toBe(1);

        expect(scannerCallback.removePackageURL).toHaveBeenCalledTimes(1);
        expect(scannerCallback.removePackageURL.mock.calls[0][0].toString()).toBe('http://my-remote-app.dev-namespace1:6066/');
        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(0);
    });

    it('removes the plugin package if no pod running', async () => {

        mockKubernetesConnector.watchPods.mockImplementation(async (namespace, cb) => {
            cb('MODIFIED', {
                metadata: {
                    uid: '1',
                    name: 'pod1',
                    namespace: 'dev-namespace1',
                    labels: {
                        app: 'my-remote-app',
                    }
                },
                spec: {
                    containers: [{
                        name: 'foo',
                        image: 'foo:1.0.1',
                        ports: [{
                            containerPort: 8080
                        }]
                    }]
                },
                status: {
                    phase: 'Failed'
                }
            });
        });

        context.services.push({
            uid: '1',
            name: 'my-remote-app',
            namespace: 'dev-namespace1',
            annotations: {},
            targetPort: '8088',
            url: new URL('http://my-remote-app.dev-namespace1:6066'),
            selector: {
                app: 'my-remote-app',
            },
            error: null,
            lastModified: 0,
            firstSeen: 0,
            imageVersion: '1.0.1',
            runningPods: 1,
        });
        context.runningPods.push({
            uid: '1',
            name: 'pod1',
            namespace: 'dev-namespace1',
            labels: {
                app: 'my-remote-app',
            },
            containers: [],
            lastModified: 0,
        });

        const scanner = new KubernetesRemotePluginPackagesScanner(null, ['dev-namespace2'], undefined, '.*',
            mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await scanner.start();

        expect(context.services.length).toBe(2);

        expect(scannerCallback.removePackageURL).toHaveBeenCalledTimes(1);
        expect(scannerCallback.removePackageURL.mock.calls[0][0].toString()).toBe('http://my-remote-app.dev-namespace1:6066/');
        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(0);
    });

    it('replaces service and re-creates the plugin package when its port changes', async () => {

        let watchCb;
        mockKubernetesConnector.watchServices.mockImplementation(async (namespace, labelSelector, cb) => {
            watchCb = cb;
            watchCb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'my-remote-app',
                    namespace: 'dev-namespace2',
                },
                spec: {
                    selector: {
                        app: 'my-remote-app',
                    },
                    clusterIP: '127.0.0.1',
                    ports: [
                        {
                            targetPort: 8080,
                            port: 6066
                        }
                    ]
                }
            });
        });
        mockKubernetesConnector.watchPods.mockImplementation(async (namespace, cb) => {
            cb('ADDED', {
                metadata: {
                    uid: '1',
                    name: 'pod1',
                    namespace: 'dev-namespace2',
                    labels: {
                        app: 'my-remote-app',
                    }
                },
                spec: {
                    containers: [{
                        name: 'foo',
                        image: 'foo:1.0.0',
                        ports: [{
                            containerPort: 8080
                        }]
                    }]
                },
                status: {
                    phase: 'Running'
                }
            });
        });

        const scanner = new KubernetesRemotePluginPackagesScanner(null, ['dev-namespace2'], undefined, '.*',
            mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await scanner.start();

        expect(context.services.length).toBe(2);
        expect(context.services[1].url?.toString()).toBe('http://my-remote-app.dev-namespace2:6066/');

        watchCb!('MODIFIED', {
            metadata: {
                uid: '1',
                name: 'my-remote-app',
                namespace: 'dev-namespace2',
            },
            spec: {
                selector: {
                    app: 'my-remote-app',
                },
                clusterIP: '127.0.0.1',
                ports: [
                    {
                        targetPort: 8080,
                        port: 6067
                    }
                ]
            }
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(context.services.length).toBe(2);
        expect(context.services[1].url?.toString()).toBe('http://my-remote-app.dev-namespace2:6067/');

        expect(scannerCallback.removePackageURL).toHaveBeenCalledTimes(1);
        expect(scannerCallback.removePackageURL.mock.calls[0][0].toString()).toBe('http://my-remote-app.dev-namespace2:6066/');
        expect(scannerCallback.addOrUpdatePackageURL).toHaveBeenCalledTimes(2);
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[1][0].toString()).toBe('http://my-remote-app.dev-namespace2:6067/');
        expect(scannerCallback.addOrUpdatePackageURL.mock.calls[1][1]).toEqual({
            packageName: 'my-remote-app',
            packageVersion: '1.0.0',
        });
    });

});
