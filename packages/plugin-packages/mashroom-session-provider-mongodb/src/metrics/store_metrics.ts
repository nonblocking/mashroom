
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportStoreMetrics = (mongoDBStore: any, pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            const connected = mongoDBStore.client && mongoDBStore.client.isConnected() ? 1 : 0;

            collectorService.gauge('mashroom_sessions_mongodb_connected', 'Mashroom Session Store MongoDB Connected').set(connected);
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportStoreMetrics = () => {
    clearInterval(interval);
};
