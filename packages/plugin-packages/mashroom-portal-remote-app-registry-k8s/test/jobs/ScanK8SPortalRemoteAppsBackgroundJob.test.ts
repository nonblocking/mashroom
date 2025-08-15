import {loggingUtils} from '@mashroom/mashroom-utils';
import ScanK8SPortalRemoteAppsBackgroundJob from '../../src/js/jobs/ScanK8SPortalRemoteAppsBackgroundJob';
import DummyKubernetesConnector from '../../src/js/k8s/DummyKubernetesConnector';
import context from '../../src/js/context';

describe('ScanK8SPortalRemoteAppsBackgroundJob', () => {

    beforeEach(() => {
        context.services = [];
        context.scannerCallback = null;
    });

    it('scans for services', async () => {
        const mockAddOrUpdatePackageURL = jest.fn();

        context.scannerCallback = {
            addOrUpdatePackageURL: mockAddOrUpdatePackageURL,
            removePackageURL: () => {
            },
        };

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['dev-namespace2'], undefined, '.*', 3,
            false, new DummyKubernetesConnector(), loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);

        const service = context.services[0];
        expect(service.namespace).toBe('dev-namespace2');
        expect(service.name).toBe('my-remote-app');
        expect(service.error).toBeFalsy();

        expect(mockAddOrUpdatePackageURL).toHaveBeenCalledTimes(1);
    });

    it('scans a remote service in a namespace found via labelSelector', async () => {
        const mockAddOrUpdatePackageURL = jest.fn();

        context.scannerCallback = {
            addOrUpdatePackageURL: mockAddOrUpdatePackageURL,
            removePackageURL: () => {
            },
        };

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(['environment=development'], null, undefined, '.*', 3,
            false, new DummyKubernetesConnector(), loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);

        const service = context.services[0];
        expect(service.namespace).toBe('dev-namespace2');
        expect(service.name).toBe('my-remote-app');

        expect(mockAddOrUpdatePackageURL).toHaveBeenCalledTimes(1);
    });

    it('scans a remote service found via labelSelector', async () => {
        const mockAddOrUpdatePackageURL = jest.fn();

        context.scannerCallback = {
            addOrUpdatePackageURL: mockAddOrUpdatePackageURL,
            removePackageURL: () => {
            },
        };

        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob('foo=bar', null, ['environment=dev'], undefined, 3,
            false, new DummyKubernetesConnector(), loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);

        const service = context.services[0];
        expect(service.namespace).toBe('whata-namespace');
        expect(service.name).toBe('my-remote-app');

        expect(mockAddOrUpdatePackageURL).toHaveBeenCalledTimes(1);
    });

    it('removes services that no longer exist', async () => {
        const mockAddOrUpdatePackageURL = jest.fn();
        const mockRemovePackageURL = jest.fn();

        context.scannerCallback = {
            addOrUpdatePackageURL: mockAddOrUpdatePackageURL,
            removePackageURL: mockRemovePackageURL,
        };

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
            false, new DummyKubernetesConnector(), loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);
        const service = context.services[0];
        expect(service.namespace).toBe('dev-namespace2');
        expect(service.name).toBe('my-remote-app');

        expect(mockRemovePackageURL).toHaveBeenCalledTimes(1);
        expect(mockAddOrUpdatePackageURL).toHaveBeenCalledTimes(1);
    });

    it('replaces service when its port changes', async () => {
        const mockAddOrUpdatePackageURL = jest.fn();
        const mockRemovePackageURL = jest.fn();

        context.scannerCallback = {
            addOrUpdatePackageURL: mockAddOrUpdatePackageURL,
            removePackageURL: mockRemovePackageURL,
        };

        const dummyNamespaceConnector = new DummyKubernetesConnector();
        const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(null, ['dev-namespace2'], undefined, '.*', 3,
            false, dummyNamespaceConnector, loggingUtils.dummyLoggerFactory);

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);
        expect(context.services[0].port).toBe(6066);
        expect(context.services[0].url.toString()).toBe('http://my-remote-app.dev-namespace2:6066/');

        const origServiceInfo = await dummyNamespaceConnector.getNamespaceServices('dev-namespace2');
        const patchedServiceInfo = {
            items: [
                {
                    ...origServiceInfo.items[0],
                    spec: {
                        ...origServiceInfo.items[0].spec,
                        ports: [{
                            port: 6067,
                        }]
                    },
                },
            ]
        };

        dummyNamespaceConnector.getNamespaceServices = jest.fn(() => Promise.resolve(patchedServiceInfo));

        await backgroundJob._scanKubernetesServices();

        expect(context.services.length).toBe(1);
        expect(context.services[0].port).toBe(6067);
        expect(context.services[0].url.toString()).toBe('http://my-remote-app.dev-namespace2:6067/');

        expect(mockRemovePackageURL).toHaveBeenCalledTimes(1);
        expect(mockAddOrUpdatePackageURL).toHaveBeenCalledTimes(2);
    });

});
