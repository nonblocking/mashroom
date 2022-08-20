import KubernetesServiceRegistry from '../src/js/registry/KubernetesServiceRegistry';

import type {KubernetesService} from '../type-definitions';

describe('KubernetesServiceRegistry', () => {

    const portalApp1: any = {};
    const portalApp2: any = {};
    const portalApp3: any = {};

    const service1: KubernetesService = {
        name: 'my-service1',
        namespace: 'default',
        ip: '10.1.2.3',
        port: 4444,
        url: 'http://my-service1.default:4444',
        firstSeen: Date.now(),
        lastCheck: Date.now(),
        status: 'Valid',
        error: null,
        foundPortalApps: [
            portalApp1,
        ]
    };

    const service2: KubernetesService = {
        name: 'my-service2',
        namespace: 'default',
        ip: '10.1.2.4',
        port: 5555,
        url: 'http://my-service2.default:5555',
        firstSeen: Date.now(),
        lastCheck: Date.now(),
        status: 'Valid',
        error: null,
        foundPortalApps: [
            portalApp2,
            portalApp3,
        ]
    };

    it('registers new services', () => {
        const registry = new KubernetesServiceRegistry();

        registry.addOrUpdateService(service1);
        registry.addOrUpdateService(service1);

        expect(registry.services.length).toBe(1);
        expect(registry.getService('my-service1')).toBeTruthy();
        expect(registry.portalApps.length).toBe(1);
    });

    it('removes services', () => {
        const registry = new KubernetesServiceRegistry();

        registry.addOrUpdateService(service1);
        registry.addOrUpdateService(service2);
        registry.removeService('my-service1');

        expect(registry.services.length).toBe(1);
        expect(registry.getService('my-service1')).toBeFalsy();
        expect(registry.portalApps.length).toBe(2);
    });


});
