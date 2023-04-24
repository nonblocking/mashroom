
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
            const {httpRequestCount, wsRequestCount, httpTargetConnectionErrorCount, httpTargetTimeoutCount} = proxy.getRequestMetrics();

            collectorService.counter('mashroom_http_proxy_requests_http_total', 'Mashroom HTTP Proxy Requests HTTP Total').set(httpRequestCount);
            collectorService.counter('mashroom_http_proxy_requests_ws_total', 'Mashroom HTTP Proxy Requests WebSocket Total').set(wsRequestCount);
            collectorService.counter('mashroom_http_proxy_requests_connection_errors', 'Mashroom HTTP Proxy Requests Connection Errors').set(httpTargetConnectionErrorCount);
            collectorService.counter('mashroom_http_proxy_requests_timeouts', 'Mashroom HTTP Proxy Requests Timeouts').set(httpTargetTimeoutCount);
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportRequestMetrics = () => {
    clearInterval(interval);
};
