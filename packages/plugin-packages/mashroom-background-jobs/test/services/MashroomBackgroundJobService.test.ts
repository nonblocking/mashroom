
import MashroomBackgroundJobService from '../../src/js/services/MashroomBackgroundJobService';
import type {MashroomBackgroundJob} from '../../type-definitions';

jest.setTimeout(10000);

const pluginContext: any = {
    loggerFactory: () => console,
}

const pluginContextHolder: any = {
    getPluginContext: () => pluginContext,
};

describe('MashroomBackgroundJobService', () => {

    it('schedules and runs a job', (done) => {
        const backgroundJobService = new MashroomBackgroundJobService(pluginContextHolder);

        let job: MashroomBackgroundJob | null = null;

        const jobCb = (pluginContext: any) => {
            expect(pluginContext).toBeTruthy();

            setTimeout(() => {
                expect(job?.lastInvocation).toBeTruthy();
                expect(job?.lastInvocation?.success).toBeTruthy();
                backgroundJobService.unscheduleJob('Test Job');
                done();
            }, 100);
        };

        job = backgroundJobService.scheduleJob('Test Job', '0/5 * * * * *', jobCb);
    });


});

