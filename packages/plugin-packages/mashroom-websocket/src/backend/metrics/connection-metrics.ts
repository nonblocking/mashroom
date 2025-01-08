
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomWebSocketServer} from '../../../type-definitions/internal';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerConnectionMetrics = (server: MashroomWebSocketServer, pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                asyncCollectorService.gauge('mashroom_websocket_connections_total', 'Mashroom WebSocket Connections Total').set(server.getClientCount());
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterConnectionMetrics = (): void => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
