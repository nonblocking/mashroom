
import type {MashroomPortalApp} from '@mashroom/mashroom-portal/type-definitions';
import type {KubernetesService, KubernetesServiceRegistry as KubernetesServiceRegistryType} from '../../../type-definitions';

export default class KubernetesServiceRegistry implements KubernetesServiceRegistryType {

    private _services: Array<KubernetesService>;

    constructor() {
        this._services = [];
    }

    getService(namespace: string, name: string): KubernetesService | undefined {
        return this._services.find((service) => service.namespace === namespace && service.name === name);
    }

    addOrUpdateService(service: KubernetesService): void {
        this.removeService(service.namespace, service.name);
        this._services.push(service);
    }

    removeService(namespace: string, name: string): void {
        const idx = this._services.findIndex((service) => service.namespace === namespace && service.name === name);
        if (idx !== -1) {
            this._services.splice(idx, 1);
        }
    }

    get services(): readonly KubernetesService[] {
        return Object.freeze([...this._services]);
    }

    get portalApps(): readonly MashroomPortalApp[] {
        const apps: Array<MashroomPortalApp> = [];
        this._services.forEach((service) => service.foundPortalApps.forEach((app) => apps.push(app)));
        return Object.freeze(apps);
    }

}
