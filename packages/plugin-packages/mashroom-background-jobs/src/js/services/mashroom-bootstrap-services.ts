
import {registerBackgroundJobMetrics, unregisterBackgroundJobMetrics} from '../metrics/background-jobs-metrics';
import MashroomBackgroundJobService from './MashroomBackgroundJobService';
import type {
    MashroomBackgroundJobService as MashroomBackgroundJobServiceType
} from '../../../type-definitions';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const cancelAllJobs = (service: MashroomBackgroundJobServiceType) => {
    service.jobs.forEach((job) => service.unscheduleJob(job.name));
};

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomBackgroundJobService(pluginContextHolder);

    registerBackgroundJobMetrics(service, pluginContextHolder);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        cancelAllJobs(service);
        unregisterBackgroundJobMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
