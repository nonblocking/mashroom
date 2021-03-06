
import {getClient} from '../mongodb_client';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportStoreMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            const client = getClient();
            const connected = client && client.isConnected() ? 1 : 0;

            collectorService.gauge('mashroom_storage_mongodb_connected', 'Mashroom Storage MongoDB Connected').set(connected);
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportStoreMetrics = () => {
    clearInterval(interval);
};
