
import type {MashroomBackgroundJobCallback} from '../../../type-definitions';
import type {
    MashroomBackgroundJobHolder,
    MashroomBackgroundJobPluginRegistry as MashroomBackgroundJobPluginRegistryType,
} from '../../../type-definitions/internal';

export default class MashroomBackgroundJobPluginRegistry implements MashroomBackgroundJobPluginRegistryType {

    private _backgroundJobs: Array<MashroomBackgroundJobHolder>;

    constructor() {
        this._backgroundJobs = [];
    }

    register(pluginName: string, cronSchedule: string, jobCallback: MashroomBackgroundJobCallback): void {
        // Remove existing
        this.unregister(pluginName);

        this._backgroundJobs.push({
            pluginName,
            cronSchedule,
            jobCallback,
        });
    }

    unregister(pluginName: string): void {
        this._backgroundJobs = this.interceptors.filter((holder) => holder.pluginName !== pluginName);
    }

    get interceptors(): Readonly<Array<MashroomBackgroundJobHolder>> {
        return Object.freeze(this._backgroundJobs);
    }

}
