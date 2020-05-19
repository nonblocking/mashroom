
import {getSessionCount} from '../middleware/MashroomSessionMiddleware';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 10000;

let interval: NodeJS.Timeout;

export const startExportSessionMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics.service;

        try {
            const sessionsTotal = await getSessionCount() || -1;
            collectorService.gauge('mashroom_sessions_total', 'Mashroom Express Sessions Total').set(sessionsTotal);
        } catch (e) {
            // Ignore
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportSessionMetrics = () => {
    clearInterval(interval);
};
