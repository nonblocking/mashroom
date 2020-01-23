
import {MashroomPortalApp} from "@mashroom/mashroom-portal/type-definitions";
import {KubernetesService, KubernetesServiceRegistry as KubernetesServiceRegistryType} from "../../../type-definitions";

export default class KubernetesServiceRegistry implements KubernetesServiceRegistryType {

    private readonly _services: Array<KubernetesService>;

    constructor() {
        this._services = [];
    }

    getService(name: string): KubernetesService | undefined {
        return this._services.find((service) => service.name === name);
    }

    addOrUpdateService(service: KubernetesService): void {
        this.removeService(service.name);
        this._services.push(service);
    }

    removeService(name: string): void {
        const idx = this._services.findIndex((service) => service.name === name);
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
