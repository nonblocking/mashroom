import context from '../../src/js/context';
import updatePluginPackageService from '../../src/js/scanner/updatePluginPackageService';

const scannerCallback = {
    addOrUpdatePackageUrl: jest.fn(),
    removePackageUrl: jest.fn()
};
context.scannerCallback = scannerCallback;

describe('updatePluginPackageService', () => {

    beforeEach(() => {
        context.watchedNamespaces = [];
        context.services = [];
        context.runningPods = [];
        scannerCallback.addOrUpdatePackageUrl.mockReset();
        scannerCallback.removePackageUrl.mockReset();
    });

    it('does not register a plugin package if no running pod available', () => {
        const service = {
            uid: '123',
            name: 'service1',
            namespace: 'namespace1',
            annotations: {},
            targetPort: '1234',
            url: new URL('http://service1.namespace1:8080'),
            selector: {
                app: 'MyApp1'
            },
            error: null,
            runningPods: 0,
            firstSeen: 0,
            imageVersion: undefined,
            lastModified: 0,
        };
        context.services.push(service);

        updatePluginPackageService(service, undefined, console as any);

        expect(service.runningPods).toBe(0);
        expect(service.error).toBe('No running Pods');

        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(0);
        expect(scannerCallback.removePackageUrl).toHaveBeenCalledTimes(0);
    });

    it('unregisters a plugin package if no running pod anymore available', () => {
        const service = {
            uid: '123',
            name: 'service1',
            namespace: 'namespace1',
            annotations: {},
            targetPort: '1234',
            url: new URL('http://service1.namespace1:8080'),
            selector: {
                app: 'MyApp1'
            },
            error: null,
            runningPods: 2,
            firstSeen: 0,
            imageVersion: '1.0.0',
            lastModified: 0,
        };
        context.services.push(service);

        updatePluginPackageService(service, undefined, console as any);

        expect(service.runningPods).toBe(0);
        expect(service.error).toBe('No running Pods');
        expect(service.imageVersion).toBeFalsy();

        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(0);
        expect(scannerCallback.removePackageUrl).toHaveBeenCalledTimes(1);
    });

    it('registers a services as a plugin package if a running pod appears', () => {
        const service = {
            uid: '123',
            name: 'service1',
            namespace: 'namespace1',
            annotations: {},
            targetPort: '1234',
            url: new URL('http://service1.namespace1:8080'),
            selector: {
                app: 'MyApp1'
            },
            error: null,
            runningPods: 0,
            firstSeen: 0,
            imageVersion: undefined,
            lastModified: 0,
        };
        context.services.push(service);
        context.runningPods.push({
            uid: '222',
            name: 'abcd',
            namespace: 'namespace1',
            labels: {
                app: 'MyApp1',
                foo: 'bar',
            },
            lastModified: Date.now(),
            containers: [{
                imageVersion: '1.0.1',
                containerPort: '1234'
            }],
        });

        updatePluginPackageService(service, undefined,  console as any);

        expect(service.runningPods).toBe(1);
        expect(service.error).toBeFalsy();

        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(1);
        expect(scannerCallback.removePackageUrl).toHaveBeenCalledTimes(0);
    });

    it('updates a plugin package if the image version changes', () => {
        const service = {
            uid: '123',
            name: 'service1',
            namespace: 'namespace1',
            annotations: {},
            targetPort: '1234',
            url: new URL('http://service1.namespace1:8080'),
            selector: {
                app: 'MyApp1'
            },
            error: null,
            runningPods: 0,
            firstSeen: 0,
            imageVersion: '1.0.1',
            lastModified: Date.now(),
        };
        context.services.push(service);
        context.runningPods.push({
            uid: '222',
            name: 'abcd',
            namespace: 'namespace1',
            labels: {
                app: 'MyApp1',
                foo: 'bar',
            },
            lastModified: Date.now(),
            containers: [{
                imageVersion: '1.0.1',
                containerPort: '1234'
            }],
        }, {
            uid: '333',
            name: 'abcd',
            namespace: 'namespace1',
            labels: {
                app: 'MyApp1',
                foo: 'bar',
            },
            lastModified: Date.now(),
            containers: [{
                imageVersion: '1.0.2',
                containerPort: '1234'
            }],
        });

        updatePluginPackageService(service, undefined, console as any);

        expect(service.runningPods).toBe(2);
        expect(service.error).toBeFalsy();
        expect(service.imageVersion).toBe('1.0.2');

        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(1);
        expect(scannerCallback.removePackageUrl).toHaveBeenCalledTimes(0);
    });

    it('removes a plugin package if the service URL changes', () => {
        const service = {
            uid: '123',
            name: 'service1',
            namespace: 'namespace1',
            annotations: {},
            targetPort: '1234',
            url: new URL('http://service1.namespace1:8080'),
            selector: {
                app: 'MyApp1'
            },
            error: null,
            runningPods: 0,
            firstSeen: 0,
            imageVersion: '1.0.1',
            lastModified: Date.now(),
        };
        context.services.push(service);
        context.runningPods.push({
            uid: '222',
            name: 'abcd',
            namespace: 'namespace1',
            labels: {
                app: 'MyApp1',
                foo: 'bar',
            },
            lastModified: Date.now(),
            containers: [{
                imageVersion: '1.0.1',
                containerPort: '1234'
            }],
        });

        updatePluginPackageService(service, new URL('http://service1.namespace1:8888'), console as any);

        expect(service.runningPods).toBe(1);
        expect(service.error).toBeFalsy();

        expect(scannerCallback.addOrUpdatePackageUrl).toHaveBeenCalledTimes(1);
        expect(scannerCallback.removePackageUrl).toHaveBeenCalledTimes(1);
    });
});
