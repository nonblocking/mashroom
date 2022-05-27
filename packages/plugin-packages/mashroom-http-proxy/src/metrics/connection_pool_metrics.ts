
import {getPoolConfig, getHttpPoolMetrics, getHttpsPoolMetrics} from '../connection_pool';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportPoolMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;

        if (collectorService) {
            const config = getPoolConfig();
            const httpPoolStats = getHttpPoolMetrics();
            const httpsPoolStats = getHttpsPoolMetrics();

            if (httpPoolStats) {
                collectorService.gauge('mashroom_http_proxy_active_connections_total', 'Mashroom HTTP Proxy Active Connections Total').set(httpPoolStats.activeConnections);
                collectorService.gauge('mashroom_http_proxy_idle_connections_total', 'Mashroom HTTP Proxy Idle (Free) Connections Total').set(httpPoolStats.idleConnections);
                collectorService.gauge('mashroom_http_proxy_max_connections', 'Mashroom HTTP Proxy Max Connections').set(config.maxSockets);
                collectorService.gauge('mashroom_http_proxy_waiting_requests_total', 'Mashroom HTTP Proxy Waiting Requests (in Queue)').set(httpPoolStats.waitingRequests);
            }

            if (httpsPoolStats) {
                collectorService.gauge('mashroom_https_proxy_active_connections_total', 'Mashroom HTTPS Proxy Active Connections Total').set(httpsPoolStats.activeConnections);
                collectorService.gauge('mashroom_https_proxy_idle_connections_total', 'Mashroom HTTPS Proxy Idle (Free) Connections Total').set(httpsPoolStats.idleConnections);
                collectorService.gauge('mashroom_https_proxy_max_connections', 'Mashroom HTTPS Proxy Max Connections').set(config.maxSockets);
                collectorService.gauge('mashroom_https_proxy_waiting_requests_total', 'Mashroom HTTPS Proxy Waiting Requests (in Queue)').set(httpsPoolStats.waitingRequests);
            }
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportPoolMetrics = () => {
    clearInterval(interval);
};
