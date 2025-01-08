
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomMonitoringMetricsCollectorService,
    MashroomMonitoringMetricsObservableCallbackRef
} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomBackgroundJobService} from '../../../type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerBackgroundJobMetrics = (backgroundJobService: MashroomBackgroundJobService, pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                const jobsTotal = backgroundJobService.jobs.length;
                const jobsFailed = backgroundJobService.jobs.filter((j) => j.lastInvocation && !j.lastInvocation.success).length;

                asyncCollectorService.gauge('mashroom_background_jobs_total', 'Mashroom Background Jobs Total').set(jobsTotal);
                asyncCollectorService.gauge('mashroom_background_jobs_failed', 'Mashroom Background Jobs In Failed State').set(jobsFailed);
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterBackgroundJobMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
