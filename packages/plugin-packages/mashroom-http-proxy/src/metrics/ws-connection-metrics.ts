
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {Proxy} from '../../type-definitions/internal';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerWsConnectionMetrics = (proxy: Proxy, pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                const wsMetrics = proxy.getWSConnectionMetrics();
                const {activeConnections, activeConnectionsTargetCount} = wsMetrics ?? {};

                asyncCollectorService.gauge('mashroom_http_proxy_ws_connections_active_total', 'Mashroom HTTP Proxy Active WebSocket Connections Total').set(activeConnections ?? 0);
                const activeConnectionsPerTargetGauge = asyncCollectorService.gauge('mashroom_http_proxy_ws_connections_active', 'Mashroom HTTP Proxy Active WebSocket Connections per Target');
                Object.keys(activeConnectionsTargetCount ?? {}).forEach((target) => {
                    activeConnectionsPerTargetGauge.set(activeConnectionsTargetCount![target], {target});
                });
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterWsConnectionMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
