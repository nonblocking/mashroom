
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {Proxy} from '../../type-definitions/internal';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportWsConnectionMetrics = (proxy: Proxy, pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;
        const wsMetrics = proxy.getWSConnectionMetrics();

        if (collectorService && wsMetrics) {
            const {activeConnections, activeConnectionsTargetCount} = wsMetrics;

            collectorService.gauge('mashroom_http_proxy_ws_connections_active_total', 'Mashroom HTTP Proxy Active WebSocket Connections Total').set(activeConnections);
            const activeConnectionsPerTargetGauge = collectorService.gauge('mashroom_http_proxy_ws_connections_active', 'Mashroom HTTP Proxy Active WebSocket Connections per Target');
            activeConnectionsPerTargetGauge.reset();
            Object.keys(activeConnectionsTargetCount).forEach((target) => {
                activeConnectionsPerTargetGauge.set(activeConnectionsTargetCount[target], { target });
            });
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportWsConnectionMetrics = () => {
    clearInterval(interval);
};
