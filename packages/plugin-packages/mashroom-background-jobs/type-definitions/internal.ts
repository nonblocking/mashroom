
import type {MashroomBackgroundJobCallback} from './api';

export type MashroomBackgroundJobHolder = {
    readonly pluginName: string;
    readonly cronSchedule: string;
    readonly jobCallback: MashroomBackgroundJobCallback;
}

export interface MashroomBackgroundJobPluginRegistry {
    readonly interceptors: Readonly<Array<MashroomBackgroundJobHolder>>;
    register(pluginName: string, cronSchedule: string, jobCallback: MashroomBackgroundJobCallback): void;
    unregister(pluginName: string): void;
}
