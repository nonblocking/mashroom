
import {getHttpAgentMetrics, getHttpsAgentMetrics, getRequestMetrics} from '../utils/resource-utils';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerRemoteResourcesMetrics = (contextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = contextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                const pluginContext = contextHolder.getPluginContext();
                const logger = pluginContext.loggerFactory('mashroom.httpProxy');
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

                const httpRequestCounter = asyncCollectorService.counter('mashroom_portal_remote_resources_requests_total', 'Mashroom Portal Remote Resources Requests Total');
                httpRequestCounter.set(httpRequestCountTotal);
                Object.keys((httpRequestTargetCount)).forEach((target) => {
                    httpRequestCounter.set(httpRequestTargetCount[target], {target});
                });
                const httpConnectionErrorCounter = asyncCollectorService.counter('mashroom_portal_remote_resources_requests_connection_errors', 'Mashroom Portal Remote Resources Requests Connection Errors');
                httpConnectionErrorCounter.set(httpConnectionErrorCountTotal);
                Object.keys((httpConnectionErrorTargetCount)).forEach((target) => {
                    httpConnectionErrorCounter.set(httpConnectionErrorTargetCount[target], {target});
                });
                const httpTimeoutCounter = asyncCollectorService.counter('mashroom_portal_remote_resources_requests_timeouts', 'Mashroom Portal Remote Resources Requests Timeouts');
                httpTimeoutCounter.set(httpTimeoutCountTotal);
                Object.keys((httpTimeoutTargetCount)).forEach((target) => {
                    httpTimeoutCounter.set(httpTimeoutTargetCount[target], {target});
                });

                if (httpAgentStats) {
                    const {activeConnections, idleConnections, waitingRequests} = httpAgentStats;

                    asyncCollectorService.gauge('mashroom_portal_remote_resources_http_pool_connections_active_total', 'Mashroom Portal Remote Resources HTTP Pool Active Connections Total').set(activeConnections);
                    asyncCollectorService.gauge('mashroom_portal_remote_resources_http_pool_connections_idle_total', 'Mashroom Portal Remote Resources HTTP Pool Idle Connections Total').set(idleConnections);
                    asyncCollectorService.gauge('mashroom_portal_remote_resources_http_pool_waiting_requests_total', 'Mashroom Portal Remote Resources HTTP Pool Waiting Requests (in Queue)').set(waitingRequests);
                }

                if (httpsAgentStats) {
                    const {activeConnections, idleConnections, waitingRequests} = httpsAgentStats;

                    asyncCollectorService.gauge('mashroom_portal_remote_resources_https_pool_connections_active_total', 'Mashroom Portal Remote Resources HTTPS Pool Active Connections Total').set(activeConnections);
                    asyncCollectorService.gauge('mashroom_portal_remote_resources_https_pool_connections_idle_total', 'Mashroom Portal Remote Resources HTTPS Pool Idle Connections Total').set(idleConnections);
                    asyncCollectorService.gauge('mashroom_portal_remote_resources_https_pool_waiting_requests_total', 'Mashroom Portal Remote Resources HTTPS Pool Waiting Requests (in Queue)').set(waitingRequests);
                }
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterHttpResourcesMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
