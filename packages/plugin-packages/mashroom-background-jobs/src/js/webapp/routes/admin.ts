
import type {Request, Response} from 'express';
import type {MashroomBackgroundJobService} from '../../../../type-definitions';

type JobModel = {
    name: string;
    nextInvocation: string;
    lastInvocation: string;
    executionTime: string;
    statusClass: string;
    status: string;
}

const formatDate = (date: Date | undefined): string => {
    return date ? new Date(date).toISOString().replace(/T/, ' ').replace(/\..+/, '') : '-';
};

export const adminIndex = async (req: Request, res: Response) => {
    const backgroundJobsService: MashroomBackgroundJobService = req.pluginContext.services.backgroundJobs.service;

    const jobs: Array<JobModel> = backgroundJobsService.jobs.map(({name, lastInvocation, nextInvocation}) => ({
        name,
        nextInvocation: formatDate(nextInvocation),
        lastInvocation: formatDate(lastInvocation?.timestamp),
        executionTime: lastInvocation ? `${lastInvocation.executionTimeMs}ms` : '',
        statusClass: lastInvocation ? (lastInvocation.success ? 'success' : 'error') : '',
        status: lastInvocation ? (lastInvocation.success ? 'Success' : `Error: ${lastInvocation?.errorMessage}`) : '',
    }));

    res.render('admin', {
        baseUrl: req.baseUrl,
        jobs,
    });
};
