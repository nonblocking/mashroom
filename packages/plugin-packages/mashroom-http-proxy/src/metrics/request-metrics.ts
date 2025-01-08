
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {Proxy} from '../../type-definitions/internal';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerRequestMetrics = (proxy: Proxy, pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                const {
                    httpRequestCountTotal,
                    httpRequestTargetCount,
                    httpConnectionErrorCountTotal,
                    httpConnectionErrorTargetCount,
                    httpTimeoutCountTotal,
                    httpTimeoutTargetCount,
                    wsRequestCountTotal,
                    wsRequestTargetCount,
                    wsConnectionErrorCountTotal,
                    wsConnectionErrorTargetCount,
                } = proxy.getRequestMetrics();

                const httpRequestCounter = asyncCollectorService.counter('mashroom_http_proxy_requests_http_total', 'Mashroom HTTP Proxy Requests HTTP Total');
                httpRequestCounter.set(httpRequestCountTotal);
                Object.keys((httpRequestTargetCount)).forEach((target) => {
                    httpRequestCounter.set(httpRequestTargetCount[target], {target});
                });
                const httpConnectionErrorCounter = asyncCollectorService.counter('mashroom_http_proxy_requests_http_connection_errors', 'Mashroom HTTP Proxy Requests HTTP Connection Errors');
                httpConnectionErrorCounter.set(httpConnectionErrorCountTotal);
                Object.keys((httpConnectionErrorTargetCount)).forEach((target) => {
                    httpConnectionErrorCounter.set(httpConnectionErrorTargetCount[target], {target});
                });
                const httpTimeoutCounter = asyncCollectorService.counter('mashroom_http_proxy_requests_http_timeouts', 'Mashroom HTTP Proxy Requests HTTP Timeouts');
                httpTimeoutCounter.set(httpTimeoutCountTotal);
                Object.keys((httpTimeoutTargetCount)).forEach((target) => {
                    httpTimeoutCounter.set(httpTimeoutTargetCount[target], {target});
                });

                const wsRequestCounter = asyncCollectorService.counter('mashroom_http_proxy_requests_ws_total', 'Mashroom HTTP Proxy Requests WebSocket Total');
                wsRequestCounter.set(wsRequestCountTotal);
                Object.keys((wsRequestTargetCount)).forEach((target) => {
                    wsRequestCounter.set(wsRequestTargetCount[target], {target});
                });
                const wsConnectionErrorCounter = asyncCollectorService.counter('mashroom_http_proxy_requests_ws_connection_errors', 'Mashroom HTTP Proxy Requests WebSocket Connection Errors');
                wsConnectionErrorCounter.set(wsConnectionErrorCountTotal);
                Object.keys((wsConnectionErrorTargetCount)).forEach((target) => {
                    wsConnectionErrorCounter.set(wsConnectionErrorTargetCount[target], {target});
                });
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterRequestMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
