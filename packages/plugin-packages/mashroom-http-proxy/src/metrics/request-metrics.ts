
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {Proxy} from '../../type-definitions/internal';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportRequestMetrics = (proxy: Proxy, pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;

        if (collectorService) {
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

            const httpRequestCounter = collectorService.counter('mashroom_http_proxy_requests_http_total', 'Mashroom HTTP Proxy Requests HTTP Total');
            httpRequestCounter.set(httpRequestCountTotal);
            Object.keys((httpRequestTargetCount)).forEach((target) => {
                httpRequestCounter.set(httpRequestTargetCount[target], { target });
            });
            const httpConnectionErrorCounter = collectorService.counter('mashroom_http_proxy_requests_http_connection_errors', 'Mashroom HTTP Proxy Requests HTTP Connection Errors');
            httpConnectionErrorCounter.set(httpConnectionErrorCountTotal);
            Object.keys((httpConnectionErrorTargetCount)).forEach((target) => {
                httpConnectionErrorCounter.set(httpConnectionErrorTargetCount[target], { target });
            });
            const httpTimeoutCounter = collectorService.counter('mashroom_http_proxy_requests_http_timeouts', 'Mashroom HTTP Proxy Requests HTTP Timeouts');
            httpTimeoutCounter.set(httpTimeoutCountTotal);
            Object.keys((httpTimeoutTargetCount)).forEach((target) => {
                httpTimeoutCounter.set(httpTimeoutTargetCount[target], { target });
            });

            const wsRequestCounter = collectorService.counter('mashroom_http_proxy_requests_ws_total', 'Mashroom HTTP Proxy Requests WebSocket Total');
            wsRequestCounter.set(wsRequestCountTotal);
            Object.keys((wsRequestTargetCount)).forEach((target) => {
                wsRequestCounter.set(wsRequestTargetCount[target], { target });
            });
            const wsConnectionErrorCounter = collectorService.counter('mashroom_http_proxy_requests_ws_connection_errors', 'Mashroom HTTP Proxy Requests WebSocket Connection Errors');
            wsConnectionErrorCounter.set(wsConnectionErrorCountTotal);
            Object.keys((wsConnectionErrorTargetCount)).forEach((target) => {
                wsConnectionErrorCounter.set(wsConnectionErrorTargetCount[target], {target});
            });
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportRequestMetrics = () => {
    clearInterval(interval);
};
