import type {
    MashroomPluginConfig,
    MashroomPluginContext,
    MashroomPluginContextHolder
} from '@mashroom/mashroom/type-definitions';

export type MashroomBackgroundJobCallback = (pluginContext: MashroomPluginContext) => void | Promise<void>;

export type JobInvocation = {
    readonly timestamp: Date;
    readonly executionTimeMs: number;
    readonly success: boolean;
    readonly errorMessage?: string | undefined;
}

export interface MashroomBackgroundJob {
    readonly name: string;
    lastInvocation: JobInvocation | undefined;
    nextInvocation: Date | undefined;
    invokeNow(): void;
}

export interface MashroomBackgroundJobService {

    /**
     * Schedule a job.
     * If cronSchedule is not defined the job is executed once (immediately).
     * Throws an error if the cron expression is invalid.
     */
    scheduleJob(name: string, cronSchedule: string | undefined | null, callback: MashroomBackgroundJobCallback): MashroomBackgroundJob;

    /**
     * Unschedule an existing job
     */
    unscheduleJob(name: string): void;

    readonly jobs: Readonly<Array<MashroomBackgroundJob>>;
}

/*
 * Bootstrap method definition for background-job plugins
 */
export type MashroomBackgroundJobPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => MashroomBackgroundJobCallback;


