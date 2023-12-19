
import {getHttpPoolMetrics, getHttpsPoolMetrics} from '../connection-pool';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportHttpPoolMetrics = (contextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = contextHolder.getPluginContext();
        const logger = pluginContext.loggerFactory('mashroom.httpProxy');
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;

        if (collectorService) {
            const httpPoolStats = getHttpPoolMetrics(logger);
            const httpsPoolStats = getHttpsPoolMetrics(logger);

            if (httpPoolStats) {
                const {activeConnections, activeConnectionsTargetCount, idleConnections, waitingRequests, waitingRequestsTargetCount} = httpPoolStats;

                collectorService.gauge('mashroom_http_proxy_http_pool_connections_active_total', 'Mashroom HTTP Proxy HTTP Pool Active Connections Total').set(activeConnections);
                const activeConnectionsPerTargetGauge = collectorService.gauge('mashroom_http_proxy_http_pool_connections_active', 'Mashroom HTTP Proxy HTTP Pool Active Connections per Target');
                activeConnectionsPerTargetGauge.reset();
                Object.keys(activeConnectionsTargetCount).forEach((target) => {
                    activeConnectionsPerTargetGauge.set(activeConnectionsTargetCount[target], { target });
                });
                collectorService.gauge('mashroom_http_proxy_http_pool_connections_idle_total', 'Mashroom HTTP Proxy HTTP Pool Idle Connections Total').set(idleConnections);
                collectorService.gauge('mashroom_http_proxy_http_pool_waiting_requests_total', 'Mashroom HTTP Proxy HTTP Pool Waiting Requests (in Queue)').set(waitingRequests);
                const waitingRequestPerTargetGauge = collectorService.gauge('mashroom_http_proxy_http_pool_waiting_requests', 'Mashroom HTTP Proxy HTTP Pool Waiting Requests per Target');
                waitingRequestPerTargetGauge.reset();
                Object.keys(waitingRequestsTargetCount).forEach((target) => {
                    waitingRequestPerTargetGauge.set(waitingRequestsTargetCount[target], { target });
                });
            }

            if (httpsPoolStats) {
                const {activeConnections, activeConnectionsTargetCount, idleConnections, waitingRequests, waitingRequestsTargetCount} = httpsPoolStats;

                collectorService.gauge('mashroom_http_proxy_https_pool_connections_active_total', 'Mashroom HTTP Proxy HTTPS Pool Active Connections Total').set(activeConnections);
                const activeConnectionsPerTargetGauge = collectorService.gauge('mashroom_http_proxy_https_pool_connections_active', 'Mashroom HTTP Proxy HTTPS Pool Active Connections per Target');
                activeConnectionsPerTargetGauge.reset();
                Object.keys(activeConnectionsTargetCount).forEach((target) => {
                    activeConnectionsPerTargetGauge.set(activeConnectionsTargetCount[target], { target });
                });
                collectorService.gauge('mashroom_http_proxy_https_pool_connections_idle_total', 'Mashroom HTTP Proxy HTTPS Pool Idle Connections Total').set(idleConnections);
                collectorService.gauge('mashroom_http_proxy_https_pool_waiting_requests_total', 'Mashroom HTTP Proxy HTTPS Pool Waiting Requests (in Queue)').set(waitingRequests);
                const waitingRequestPerTargetGauge = collectorService.gauge('mashroom_http_proxy_https_pool_waiting_requests', 'Mashroom HTTP Proxy HTTPS Pool Waiting Requests per Target');
                waitingRequestPerTargetGauge.reset();
                Object.keys(waitingRequestsTargetCount).forEach((target) => {
                    waitingRequestPerTargetGauge.set(waitingRequestsTargetCount[target], { target });
                });
            }
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportHttpPoolMetrics = () => {
    clearInterval(interval);
};
