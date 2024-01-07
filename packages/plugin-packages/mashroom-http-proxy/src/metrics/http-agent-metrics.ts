
import {getHttpAgentMetrics, getHttpsAgentMetrics} from '../connection-pool';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerHttpAgentMetrics = (contextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = contextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                const pluginContext = contextHolder.getPluginContext();
                const logger = pluginContext.loggerFactory('mashroom.httpProxy');

                const addHttpMetrics = () => {
                    const httpAgentStats = getHttpAgentMetrics(logger);
                    const {activeConnections, idleConnections, waitingRequests} = httpAgentStats ?? {};

                    asyncCollectorService.gauge('mashroom_http_proxy_http_pool_connections_active_total', 'Mashroom HTTP Proxy HTTP Pool Active Connections Total').set(activeConnections ?? 0);
                    asyncCollectorService.gauge('mashroom_http_proxy_http_pool_connections_idle_total', 'Mashroom HTTP Proxy HTTP Pool Idle Connections Total').set(idleConnections ?? 0);
                    asyncCollectorService.gauge('mashroom_http_proxy_http_pool_waiting_requests_total', 'Mashroom HTTP Proxy HTTP Pool Waiting Requests (in Queue)').set(waitingRequests ?? 0);
                };
                const addHttpsMetrics = () => {
                    const httpsAgentStats = getHttpsAgentMetrics(logger);
                    const {activeConnections, idleConnections, waitingRequests} = httpsAgentStats ?? {};

                    asyncCollectorService.gauge('mashroom_http_proxy_https_pool_connections_active_total', 'Mashroom HTTP Proxy HTTPS Pool Active Connections Total').set(activeConnections ?? 0);
                    asyncCollectorService.gauge('mashroom_http_proxy_https_pool_connections_idle_total', 'Mashroom HTTP Proxy HTTPS Pool Idle Connections Total').set(idleConnections ?? 0);
                    asyncCollectorService.gauge('mashroom_http_proxy_https_pool_waiting_requests_total', 'Mashroom HTTP Proxy HTTPS Pool Waiting Requests (in Queue)').set(waitingRequests ?? 0);
                };

                addHttpMetrics();
                addHttpsMetrics();
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterHttpAgentMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
