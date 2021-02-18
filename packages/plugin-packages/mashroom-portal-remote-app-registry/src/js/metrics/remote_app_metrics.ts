
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomPortalRemoteAppEndpointService, RemotePortalAppEndpoint} from '../../../type-definitions';

const EXPORT_INTERVAL_MS = 10000;

let interval: ReturnType<typeof setInterval> | undefined;

export const startExportRemoteAppMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = pluginContext.services.remotePortalAppEndpoint.service;
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            const endpoints = await portalRemoteAppEndpointService.findAll();
            const endpointsTotal = endpoints.length;
            const endpointsWithError = endpoints.filter((e) => !!e.lastError).length;
            const endpointsWithTimeouts = endpoints.filter((e) => e.lastError && e.lastError.indexOf('ETIMEDOUT') !== -1).length;

            collectorService.gauge('mashroom_remote_apps_total', 'Mashroom Remote Apps Total').set(endpointsTotal);
            collectorService.gauge('mashroom_remote_apps_error_total', 'Mashroom Remote Apps With Error').set(endpointsWithError);
            collectorService.gauge('mashroom_remote_apps_connection_timeout_total', 'Mashroom Remote Apps With Connection Timeout').set(endpointsWithTimeouts);
        }
    }, EXPORT_INTERVAL_MS);
}

export const stopExportRemoteAppMetrics = () => {
    if (interval) {
        clearInterval(interval);
    }
};
