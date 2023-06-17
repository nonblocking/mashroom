
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
                wsRequestCount,
            } = proxy.getRequestMetrics();

            const requestCounter = collectorService.counter('mashroom_http_proxy_requests_http_total', 'Mashroom HTTP Proxy Requests HTTP Total');
            requestCounter.set(httpRequestCountTotal);
            Object.keys((httpRequestTargetCount)).forEach((target) => {
                requestCounter.set(httpRequestTargetCount[target], { target });
            });
            const connectionErrorCounter = collectorService.counter('mashroom_http_proxy_requests_connection_errors', 'Mashroom HTTP Proxy Requests Connection Errors');
            connectionErrorCounter.set(httpConnectionErrorCountTotal);
            Object.keys((httpConnectionErrorTargetCount)).forEach((target) => {
                connectionErrorCounter.set(httpConnectionErrorTargetCount[target], { target });
            });
            const timeoutCounter = collectorService.counter('mashroom_http_proxy_requests_timeouts', 'Mashroom HTTP Proxy Requests Timeouts');
            timeoutCounter.set(httpTimeoutCountTotal);
            Object.keys((httpTimeoutTargetCount)).forEach((target) => {
                timeoutCounter.set(httpTimeoutTargetCount[target], { target });
            });
            collectorService.counter('mashroom_http_proxy_requests_ws_total', 'Mashroom HTTP Proxy Requests WebSocket Total').set(wsRequestCount);
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportRequestMetrics = () => {
    clearInterval(interval);
};
