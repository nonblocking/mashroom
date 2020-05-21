
import {getSessionCount} from '../middleware/MashroomSessionMiddleware';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 10000;

let interval: NodeJS.Timeout;

export const startExportSessionMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            let sessionsTotal = -1;
            try {
                sessionsTotal = await getSessionCount() || -1;
            } catch (e) {
                // Ignore
            }
            collectorService.gauge('mashroom_sessions_total', 'Mashroom Express Sessions Total').set(sessionsTotal);
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportSessionMetrics = () => {
    clearInterval(interval);
};
