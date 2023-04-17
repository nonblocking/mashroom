
import {getPoolConfig, getHttpPoolMetrics, getHttpsPoolMetrics} from '../connection_pool';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportPoolMetrics = (contextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = contextHolder.getPluginContext();
        const logger = pluginContext.loggerFactory('mashroom.httpProxy');
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;

        if (collectorService) {
            const config = getPoolConfig();
            const httpPoolStats = getHttpPoolMetrics(logger);
            const httpsPoolStats = getHttpsPoolMetrics(logger);

            if (httpPoolStats) {
                const {activeConnections, activeConnectionsTargetCount, idleConnections, waitingRequests, waitingRequestsTargetCount} = httpPoolStats;

                collectorService.gauge('mashroom_http_proxy_active_connections_total', 'Mashroom HTTP Proxy Active Connections Total').set(activeConnections);
                const activeConnectionsPerTargetGauge = collectorService.gauge('mashroom_http_proxy_active_connections', 'Mashroom HTTP Proxy Active Connections per Target');
                activeConnectionsPerTargetGauge.reset();
                Object.keys(activeConnectionsTargetCount).forEach((target) => {
                    activeConnectionsPerTargetGauge.set(activeConnectionsTargetCount[target], { target });
                });
                collectorService.gauge('mashroom_http_proxy_idle_connections_total', 'Mashroom HTTP Proxy Idle (Free) Connections Total').set(idleConnections);
                collectorService.gauge('mashroom_http_proxy_max_connections', 'Mashroom HTTP Proxy Max Connections Per Host').set(config.maxSockets);
                collectorService.gauge('mashroom_http_proxy_waiting_requests_total', 'Mashroom HTTP Proxy Waiting Requests (in Queue)').set(waitingRequests);
                const waitingRequestPerTargetGauge = collectorService.gauge('mashroom_http_proxy_waiting_requests', 'Mashroom HTTP Proxy Waiting Requests per Target');
                waitingRequestPerTargetGauge.reset();
                Object.keys(waitingRequestsTargetCount).forEach((target) => {
                    waitingRequestPerTargetGauge.set(waitingRequestsTargetCount[target], { target });
                });
            }

            if (httpsPoolStats) {
                const {activeConnections, activeConnectionsTargetCount, idleConnections, waitingRequests, waitingRequestsTargetCount} = httpsPoolStats;

                collectorService.gauge('mashroom_https_proxy_active_connections_total', 'Mashroom HTTPS Proxy Active Connections Total').set(activeConnections);
                const activeConnectionsPerTargetGauge = collectorService.gauge('mashroom_https_proxy_active_connections', 'Mashroom HTTPS Proxy Active Connections per Target');
                activeConnectionsPerTargetGauge.reset();
                Object.keys(activeConnectionsTargetCount).forEach((target) => {
                    activeConnectionsPerTargetGauge.set(activeConnectionsTargetCount[target], { target });
                });
                collectorService.gauge('mashroom_https_proxy_idle_connections_total', 'Mashroom HTTPS Proxy Idle (Free) Connections Total').set(idleConnections);
                collectorService.gauge('mashroom_https_proxy_max_connections', 'Mashroom HTTPS Proxy Max Connections Per Host').set(config.maxSockets);
                collectorService.gauge('mashroom_https_proxy_waiting_requests_total', 'Mashroom HTTPS Proxy Waiting Requests (in Queue)').set(waitingRequests);
                const waitingRequestPerTargetGauge = collectorService.gauge('mashroom_https_proxy_waiting_requests', 'Mashroom HTTPS Proxy Waiting Requests per Target');
                waitingRequestPerTargetGauge.reset();
                Object.keys(waitingRequestsTargetCount).forEach((target) => {
                   waitingRequestPerTargetGauge.set(waitingRequestsTargetCount[target], { target });
                });
            }
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportPoolMetrics = () => {
    clearInterval(interval);
};
