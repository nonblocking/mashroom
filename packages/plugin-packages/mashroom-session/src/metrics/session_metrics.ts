
import {getSessionCount} from '../middleware/MashroomSessionMiddleware';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

// Counting sessions can be an expensive operation (e.g. in Redis)
//   so don't run it too often
const EXPORT_INTERVAL_MS = 30000;

let interval: NodeJS.Timeout;

export const startExportSessionMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            let sessionsTotal = -1;
            try {
                const count = await getSessionCount();
                if (typeof (count) === 'number') {
                    sessionsTotal = count;
                }
            } catch (e) {
                // Ignore
            }
            collectorService.gauge('mashroom_sessions_total', `Mashroom Express Sessions Total (-1 means the store doesn't support the length() operation)`).set(sessionsTotal);
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportSessionMetrics = () => {
    clearInterval(interval);
};
