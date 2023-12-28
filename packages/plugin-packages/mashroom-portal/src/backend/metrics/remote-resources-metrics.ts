
import {getHttpAgentMetrics, getHttpsAgentMetrics, getRequestMetrics} from '../utils/resource-utils';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportRemoteResourcesMetrics = (contextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = contextHolder.getPluginContext();
        const logger = pluginContext.loggerFactory('mashroom.httpProxy');
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;

        if (collectorService) {
            const httpAgentStats = getHttpAgentMetrics(logger);
            const httpsAgentStats = getHttpsAgentMetrics(logger);
            const {
                httpRequestCountTotal,
                httpRequestTargetCount,
                httpConnectionErrorCountTotal,
                httpConnectionErrorTargetCount,
                httpTimeoutCountTotal,
                httpTimeoutTargetCount
            } = getRequestMetrics();

            const httpRequestCounter = collectorService.counter('mashroom_portal_remote_resources_requests_total', 'Mashroom Portal Remote Resources Requests Total');
            httpRequestCounter.set(httpRequestCountTotal);
            Object.keys((httpRequestTargetCount)).forEach((target) => {
                httpRequestCounter.set(httpRequestTargetCount[target], { target });
            });
            const httpConnectionErrorCounter = collectorService.counter('mashroom_portal_remote_resources_requests_connection_errors', 'Mashroom Portal Remote Resources Requests Connection Errors');
            httpConnectionErrorCounter.set(httpConnectionErrorCountTotal);
            Object.keys((httpConnectionErrorTargetCount)).forEach((target) => {
                httpConnectionErrorCounter.set(httpConnectionErrorTargetCount[target], { target });
            });
            const httpTimeoutCounter = collectorService.counter('mashroom_portal_remote_resources_requests_timeouts', 'Mashroom Portal Remote Resources Requests Timeouts');
            httpTimeoutCounter.set(httpTimeoutCountTotal);
            Object.keys((httpTimeoutTargetCount)).forEach((target) => {
                httpTimeoutCounter.set(httpTimeoutTargetCount[target], { target });
            });

            if (httpAgentStats) {
                const {activeConnections, activeConnectionsTargetCount, idleConnections, waitingRequests, waitingRequestsTargetCount} = httpAgentStats;

                collectorService.gauge('mashroom_portal_remote_resources_http_pool_connections_active_total', 'Mashroom Portal Remote Resources HTTP Pool Active Connections Total').set(activeConnections);
                const activeConnectionsPerTargetGauge = collectorService.gauge('mashroom_http_proxy_http_pool_connections_active', 'Mashroom Portal Remote Resources HTTP Pool Active Connections per Target');
                activeConnectionsPerTargetGauge.reset();
                Object.keys(activeConnectionsTargetCount).forEach((target) => {
                    activeConnectionsPerTargetGauge.set(activeConnectionsTargetCount[target], { target });
                });
                collectorService.gauge('mashroom_portal_remote_resources_http_pool_connections_idle_total', 'Mashroom Portal Remote Resources HTTP Pool Idle Connections Total').set(idleConnections);
                collectorService.gauge('mashroom_portal_remote_resources_http_pool_waiting_requests_total', 'Mashroom Portal Remote Resources HTTP Pool Waiting Requests (in Queue)').set(waitingRequests);
                const waitingRequestPerTargetGauge = collectorService.gauge('mashroom_portal_remote_resources_http_pool_waiting_requests', 'Mashroom Portal Remote Resources HTTP Pool Waiting Requests per Target');
                waitingRequestPerTargetGauge.reset();
                Object.keys(waitingRequestsTargetCount).forEach((target) => {
                    waitingRequestPerTargetGauge.set(waitingRequestsTargetCount[target], { target });
                });
            }

            if (httpsAgentStats) {
                const {activeConnections, activeConnectionsTargetCount, idleConnections, waitingRequests, waitingRequestsTargetCount} = httpsAgentStats;

                collectorService.gauge('mashroom_portal_remote_resources_https_pool_connections_active_total', 'Mashroom Portal Remote Resources HTTPS Pool Active Connections Total').set(activeConnections);
                const activeConnectionsPerTargetGauge = collectorService.gauge('mashroom_portal_remote_resources_https_pool_connections_active', 'Mashroom Portal Remote Resources HTTPS Pool Active Connections per Target');
                activeConnectionsPerTargetGauge.reset();
                Object.keys(activeConnectionsTargetCount).forEach((target) => {
                    activeConnectionsPerTargetGauge.set(activeConnectionsTargetCount[target], { target });
                });
                collectorService.gauge('mashroom_portal_remote_resources_https_pool_connections_idle_total', 'Mashroom Portal Remote Resources HTTPS Pool Idle Connections Total').set(idleConnections);
                collectorService.gauge('mashroom_portal_remote_resources_https_pool_waiting_requests_total', 'Mashroom Portal Remote Resources HTTPS Pool Waiting Requests (in Queue)').set(waitingRequests);
                const waitingRequestPerTargetGauge = collectorService.gauge('mashroom_portal_remote_resources_https_pool_waiting_requests', 'Mashroom Portal Remote Resources HTTPS Pool Waiting Requests per Target');
                waitingRequestPerTargetGauge.reset();
                Object.keys(waitingRequestsTargetCount).forEach((target) => {
                    waitingRequestPerTargetGauge.set(waitingRequestsTargetCount[target], { target });
                });
            }
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportHttpResourcesMetrics = () => {
    clearInterval(interval);
};
