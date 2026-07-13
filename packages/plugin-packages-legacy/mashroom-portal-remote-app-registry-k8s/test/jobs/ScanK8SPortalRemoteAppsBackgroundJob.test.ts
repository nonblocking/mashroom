import {loggingUtils} from '@mashroom/mashroom-utils';
import ScanK8SPortalRemoteAppsBackgroundJob from '../../src/js/jobs/ScanK8SPortalRemoteAppsBackgroundJob';
import context from '../../src/js/context';

const scannerCallback = {
    addOrUpdatePackageUrl: jest.fn(),
    removePackageUrl: jest.fn()
};
context.scannerCallback = scannerCallback;

const mockKubernetesConnector = {
    getNamespacesByLabel: jest.fn(),
    getNamespaceServices: jest.fn(),
};

describe('ScanK8SPortalRemoteAppsBackgroundJob', () => {

    beforeEach(() => {
        context.services = [];
        scannerCallback.addOrUpdatePackageUrl.mockReset();
        scannerCallback.removePackageUrl.mockReset();
        mockKubernetesConnector.getNamespacesByLabel.mockReset();
        mockKubernetesConnector.getNamespaceServices.mockReset();
    });

    it('scans for services in a given list of namespaces', async () => {

        mockKubernetesConnector.getNamespaceServices.mockImplementation(async () => {
            return {
                items: [
                    {
                        metadata: {
                            name: 'my-remote-app',
                            namespace: 'dev-namespace2',
                        },
                        spec: {
                            clusterIP: '127.0.0.1',
                            ports: [
                                {
                                    port: 6066
                                }
                            ]
                        }
                    },
                ]
            };
        });

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['dev-namespace2'], undefined, '.*', 3,
            false, mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);

        const service = context.services[0];
        expect(service.namespace).toBe('dev-namespace2');
        expect(service.name).toBe('my-remote-app');
        expect(service.error).toBeFalsy();

        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.getNamespacesByLabel).toHaveBeenCalledTimes(0);
        expect(mockKubernetesConnector.getNamespaceServices).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.getNamespaceServices.mock.calls[0][0]).toBe('dev-namespace2');
    });

    it('scans for services in namespaces found via labelSelector', async () => {

        mockKubernetesConnector.getNamespacesByLabel.mockImplementation(async () => {
            return {
                items: [
                    {
                        metadata: {
                            name: 'dev-namespace1',
                            labels: {
                                environment: 'development'
                            },
                        },
                    },
                    {
                        metadata: {
                            name: 'dev-namespace2',
                            labels: {
                                environment: 'development'
                            },
                        },
                    },
                ]
            };
        });
        mockKubernetesConnector.getNamespaceServices.mockImplementation(async (ns) => {
            if (ns === 'dev-namespace2') {
                return {
                    items: [
                        {
                            metadata: {
                                name: 'my-remote-app',
                                namespace: 'dev-namespace2',
                            },
                            spec: {
                                clusterIP: '127.0.0.1',
                                ports: [
                                    {
                                        port: 6066
                                    }
                                ]
                            }
                        },
                    ]
                };
            }
            return {
                items: [],
            };
        });

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(['environment=development'], null, undefined, '.*', 3,
            false, mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);

        const service = context.services[0];
        expect(service.namespace).toBe('dev-namespace2');
        expect(service.name).toBe('my-remote-app');

        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.getNamespacesByLabel).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.getNamespacesByLabel.mock.calls[0][0]).toBe('environment=development');
        expect(mockKubernetesConnector.getNamespaceServices).toHaveBeenCalledTimes(2);
        expect(mockKubernetesConnector.getNamespaceServices.mock.calls[0][0]).toBe('dev-namespace1');
        expect(mockKubernetesConnector.getNamespaceServices.mock.calls[1][0]).toBe('dev-namespace2');
    });

    it('scans for services via labelSelector', async () => {

        mockKubernetesConnector.getNamespacesByLabel.mockImplementation(async () => {
            return {
                items: [
                    {
                        metadata: {
                            name: 'dev-namespace1',
                            labels: {
                                environment: 'development'
                            },
                        },
                    },
                ]
            };
        });
        mockKubernetesConnector.getNamespaceServices.mockImplementation(async (ns) => {
            return {
                items: [
                    {
                        metadata: {
                            name: 'my-remote-app',
                            namespace: 'dev-namespace1',
                        },
                        spec: {
                            clusterIP: '127.0.0.1',
                            ports: [
                                {
                                    port: 6066
                                }
                            ]
                        }
                    },
                ]
            };
        });

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob('foo=bar', null, ['environment=dev'], undefined, 3,
            false, mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);

        const service = context.services[0];
        expect(service.namespace).toBe('dev-namespace1');
        expect(service.name).toBe('my-remote-app');

        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.getNamespacesByLabel).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.getNamespacesByLabel.mock.calls[0][0]).toBe('foo=bar');
        expect(mockKubernetesConnector.getNamespaceServices).toHaveBeenCalledTimes(1);
        expect(mockKubernetesConnector.getNamespaceServices.mock.calls[0][0]).toBe('dev-namespace1');
        expect(mockKubernetesConnector.getNamespaceServices.mock.calls[0][1]).toBe('environment=dev');
    });

    it('removes services that no longer exist', async () => {

        mockKubernetesConnector.getNamespaceServices.mockImplementation(async (ns) => {
            return {
                items: [
                    {
                        metadata: {
                            name: 'my-remote-app',
                            namespace: 'dev-namespace1',
                        },
                        spec: {
                            clusterIP: '127.0.0.1',
                            ports: [
                                {
                                    port: 6066
                                }
                            ]
                        }
                    },
                ]
            };
        });

        context.services.push({
            name: 'existing-service',
            namespace: 'dev-namespace2',
            url: new URL('http://foo.bar'),
            port: undefined,
            ip: undefined,
            error: null,
            lastCheck: 0,
            firstSeen: 0,
        });

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['dev-namespace2'], undefined, '.*', 3,
            false, mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);
        const service = context.services[0];
        expect(service.namespace).toBe('dev-namespace2');
        expect(service.name).toBe('my-remote-app');

        expect(scannerCallback.removePackageUrl).toHaveBeenCalledTimes(1);
        expect(scannerCallback.removePackageUrl.mock.calls[0][0].toString()).toBe('http://foo.bar/');
        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(1);
    });

    it('replaces service when its port changes', async () => {

        mockKubernetesConnector.getNamespaceServices.mockImplementation(async () => {
            return {
                items: [
                    {
                        metadata: {
                            name: 'my-remote-app',
                            namespace: 'dev-namespace2',
                        },
                        spec: {
                            clusterIP: '127.0.0.1',
                            ports: [
                                {
                                    port: 6066
                                }
                            ]
                        }
                    },
                ]
            };
        });

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['dev-namespace2'], undefined, '.*', 3,
            false, mockKubernetesConnector, loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);
        expect(context.services[0].port).toBe(6066);
        expect(context.services[0].url.toString()).toBe('http://my-remote-app.dev-namespace2:6066/');

        mockKubernetesConnector.getNamespaceServices.mockImplementation(async () => {
            return {
                items: [
                    {
                        metadata: {
                            name: 'my-remote-app',
                            namespace: 'dev-namespace2',
                        },
                        spec: {
                            clusterIP: '127.0.0.1',
                            ports: [
                                {
                                    port: 6067
                                }
                            ]
                        }
                    },
                ]
            };
        });

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);
        expect(context.services[0].port).toBe(6067);
        expect(context.services[0].url.toString()).toBe('http://my-remote-app.dev-namespace2:6067/');

        expect(scannerCallback.removePackageUrl).toHaveBeenCalledTimes(1);
        expect(scannerCallback.removePackageUrl.mock.calls[0][0].toString()).toBe('http://my-remote-app.dev-namespace2:6066/');
        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(2);
    });

});
