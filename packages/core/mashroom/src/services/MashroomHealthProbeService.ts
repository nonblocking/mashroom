
import type {
    MashroomHealthProbe,
    MashroomHealthProbeService as MashroomHealthProbeServiceType
} from '../../type-definitions';

export default class MashroomHealthProbeService implements MashroomHealthProbeServiceType {

    private _probes: Record<string, MashroomHealthProbe>;

    constructor() {
        this._probes = {};
    }

    registerProbe(forPlugin: string, probe: MashroomHealthProbe): void {
        this.unregisterProbe(forPlugin);
        this._probes[forPlugin] = probe;
    }
    unregisterProbe(forPlugin: string): void {
        delete this._probes[forPlugin];
    }

    getProbes() {
        return Object.freeze(Object.values(this._probes));
    }
}

