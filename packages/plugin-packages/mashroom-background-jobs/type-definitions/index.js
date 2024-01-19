// @flow

import type {MashroomPluginContext, MashroomPluginConfig, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';

export type MashroomBackgroundJobCallback = (pluginContext: MashroomPluginContext) => void | Promise<void>;

export type JobInvocation = {
    +timestamp: Date;
    +success: boolean;
    +errorMessage?: ?string;
}

export interface MashroomBackgroundJob {
    +name: string;
    lastInvocation: ?JobInvocation;
    nextInvocation: ?Date;
    invokeNow(): void;
}

export interface MashroomBackgroundJobService {

    /**
     * Schedule a job.
     * If cronSchedule is not defined the job is executed once (immediately).
     * Throws an error if the cron expression is invalid.
     */
    scheduleJob(name: string, cronSchedule: ?string, callback: MashroomBackgroundJobCallback): MashroomBackgroundJob;

    /**
     * Unschedule an existing job
     */
    unscheduleJob(name: string): void;

    +jobs: Array<MashroomBackgroundJob>;
}

/*
 * Bootstrap method definition for background-job plugins
 */
export type MashroomBackgroundJobPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => MashroomBackgroundJobCallback;
