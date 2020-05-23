// @flow


import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomWebSocketServer} from '../../../type-definitions/internal';

const EXPORT_INTERVAL_MS = 5000;

let interval: IntervalID;

export const startExportConnectionMetrics = (server: MashroomWebSocketServer, pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            collectorService.gauge('mashroom_websocket_connections_total', 'Mashroom WebSocket Connections Total').set(server.getClientCount());
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportConnectionMetrics = () => {
    clearInterval(interval);
};
