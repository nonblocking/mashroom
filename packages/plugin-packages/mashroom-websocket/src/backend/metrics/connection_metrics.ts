
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {IntervalID, MashroomWebSocketServer} from '../../../type-definitions/internal';

const EXPORT_INTERVAL_MS = 5000;

let interval: IntervalID | undefined;

export const startExportConnectionMetrics = (server: MashroomWebSocketServer, pluginContextHolder: MashroomPluginContextHolder): void => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            collectorService.gauge('mashroom_websocket_connections_total', 'Mashroom WebSocket Connections Total').set(server.getClientCount());
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportConnectionMetrics = (): void => {
    if (interval) {
        clearInterval(interval);
    }
};
