
import MashroomBackgroundJobService from '../../src/js/services/MashroomBackgroundJobService';
import type {MashroomBackgroundJob} from '../../type-definitions';

jest.setTimeout(10000);

const pluginContext: any = {
    loggerFactory: () => console,
};

const pluginContextHolder: any = {
    getPluginContext: () => pluginContext,
};

describe('MashroomBackgroundJobService', () => {

    it('schedules and runs a job', (done) => {
        if (process.env.GITHUB_WORKFLOW === 'Mashroom Run Tests Windows') {
            // TODO: find out why this test doesn't work on windows server
            done();
            return;
        }

        const backgroundJobService = new MashroomBackgroundJobService(pluginContextHolder);

        let job: MashroomBackgroundJob | null = null;

        const jobCb = (pluginContext: any) => {
            expect(pluginContext).toBeTruthy();

            setTimeout(() => {
                expect(job?.lastInvocation).toBeTruthy();
                expect(job?.lastInvocation?.success).toBeTruthy();
                expect(backgroundJobService.jobs.length).toBe(1);
                backgroundJobService.unscheduleJob('Test Job');
                done();
            }, 500);
        };

        job = backgroundJobService.scheduleJob('Test Job', '0/5 * * * * *', jobCb);
    });

    it('unschedules and cancels a job', () => {
        const backgroundJobService = new MashroomBackgroundJobService(pluginContextHolder);

        const jobCb = (pluginContext: any) => { /* nothing to do */ };

        backgroundJobService.scheduleJob('Test Job 2', '0/5 * * * * *', jobCb);
        backgroundJobService.unscheduleJob('Test Job 2');

        expect(backgroundJobService.jobs.length).toBe(0);
    });

    it('runs a job without a cron expression immediately', async () => {
        const backgroundJobService = new MashroomBackgroundJobService(pluginContextHolder);

        let executed = false;
        const jobCb = (pluginContext: any) => {
           executed = true;
        };

        const job = backgroundJobService.scheduleJob('Test Job', undefined, jobCb);

        await new Promise((resolve) => setTimeout(resolve, 1));

        expect(executed).toBeTruthy();
        expect(job.lastInvocation).toBeTruthy();
        expect(job.lastInvocation?.success).toBeTruthy();
    });

    it('measures the execution time for async jobs correctly', async () => {
        const backgroundJobService = new MashroomBackgroundJobService(pluginContextHolder);

        let executed = false;
        const jobCb = async (pluginContext: any) => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            executed = true;
        };

        const job = backgroundJobService.scheduleJob('Test Job', undefined, jobCb);

        expect(executed).toBeFalsy();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(executed).toBeTruthy();
        expect(job.lastInvocation?.executionTimeMs).toBeGreaterThan(1000);
    });
});

