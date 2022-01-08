
import nodeSchedule from 'node-schedule';
import InvalidCronExpressionError from '../errors/InvalidCronExpressionError';

import type {Job} from 'node-schedule';
import type {
    MashroomLogger,
    MashroomPluginContextHolder
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomBackgroundJobService as MashroomBackgroundJobServiceType,
    MashroomBackgroundJob,
    MashroomBackgroundJobCallback,
    JobInvocation
} from '../../../type-definitions';

type BackgroundJobExt = MashroomBackgroundJob & {
    _cancel(): void;
};

type CallbackWrapper = {
    lastInvocation: JobInvocation | undefined;
    targetCallback: MashroomBackgroundJobCallback;
    callback: () => void;
};

export default class MashroomBackgroundJobService implements MashroomBackgroundJobServiceType {

    private _logger: MashroomLogger;
    private _jobs: Array<BackgroundJobExt>;

    constructor(private _pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.backgroundJobs.service');
        this._jobs = [];
    }

    scheduleJob(name: string, cronSchedule: string | undefined | null, callback: MashroomBackgroundJobCallback): MashroomBackgroundJob {
        if (!name) {
            throw new Error('Argument name is required!');
        }
        if (!callback || typeof (callback) !== 'function') {
            throw new Error('Argument callback is required and needs to be a function!');
        }

        // Replace an existing job
        this.unscheduleJob(name);

        this._logger.info(`Scheduling background job ${name}`);

        const callbackWrapper = this.createCallbackWrapper(name, callback);

        let nodeScheduleJob;
        if (cronSchedule) {
            nodeScheduleJob = nodeSchedule.scheduleJob(cronSchedule, callbackWrapper.callback);
            if (!nodeScheduleJob) {
                this._logger.error(`Creating background job ${name} failed! Invalid cron expression!`);
                throw new InvalidCronExpressionError(cronSchedule);
            }
        }

        const job = this.createBackgroundJobInstance(name, nodeScheduleJob, callbackWrapper);
        this._jobs.push(job);

        if (!cronSchedule) {
            job.invokeNow();
        }

        return job;
    }

    unscheduleJob(name: string): void {
        this._jobs = this._jobs.filter((job) => {
            if (job.name === name) {
                this._logger.info(`Unscheduling background job ${name}`);
                job._cancel();
                return false;
            }
            return true;
        });
    }

    get jobs() {
        return Object.freeze(this._jobs);
    }

    private createCallbackWrapper(name: string, targetCallback: MashroomBackgroundJobCallback): CallbackWrapper {
        const wrapper: CallbackWrapper = {
            targetCallback,
            lastInvocation: undefined,
            callback: () => {
                const timestamp = new Date();
                this._logger.info(`Executing background job ${name}`);
                try {
                    targetCallback(this._pluginContextHolder.getPluginContext());
                    const executionTimeMs = Date.now() - timestamp.getTime();
                    this._logger.info(`Background job ${name} completed after ${executionTimeMs}ms`);
                    wrapper.lastInvocation = {
                        timestamp,
                        executionTimeMs,
                        success: true,
                    };
                } catch (error: any) {
                    const executionTimeMs = Date.now() - timestamp.getTime();
                    this._logger.error(`Execution of job ${name} failed!`, error);
                    wrapper.lastInvocation = {
                        timestamp,
                        executionTimeMs,
                        success: false,
                        errorMessage: error.message,
                    };
                }
            }
        }

        return wrapper;
    }

    private createBackgroundJobInstance(name: string, nodeScheduleJob: Job | undefined, callbackWrapper: CallbackWrapper): BackgroundJobExt {
        return {
            name,
            get lastInvocation() {
                return callbackWrapper.lastInvocation;
            },
            get nextInvocation() {
                return nodeScheduleJob?.nextInvocation();
            },
            invokeNow() {
                if (nodeScheduleJob) {
                    nodeScheduleJob.invoke();
                } else {
                    // Call directly
                    callbackWrapper.callback();
                }
            },
            _cancel() {
                nodeScheduleJob?.cancel(false);
            }
        };
    }
}
