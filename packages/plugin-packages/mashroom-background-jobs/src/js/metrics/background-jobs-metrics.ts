
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomBackgroundJobService} from '../../../type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportBackgroundJobMetrics = (backgroundJobService: MashroomBackgroundJobService, pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            const jobsTotal = backgroundJobService.jobs.length;
            const jobsFailed = backgroundJobService.jobs.filter((j) => j.lastInvocation && !j.lastInvocation.success).length;

            collectorService.gauge('mashroom_background_jobs_total', 'Mashroom Background Jobs Total').set(jobsTotal);
            collectorService.gauge('mashroom_background_jobs_failed', 'Mashroom Background Jobs In Failed State').set(jobsFailed);
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportBackgroundJobMetrics = () => {
    clearInterval(interval);
};
