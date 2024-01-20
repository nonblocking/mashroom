
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomPortalRemoteAppEndpointService} from '../../../type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerRemoteAppMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback(async (asyncCollectorService) => {
                const pluginContext = pluginContextHolder.getPluginContext();
                const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = pluginContext.services.remotePortalAppEndpoint!.service;
                const endpoints = await portalRemoteAppEndpointService.findAll();
                const endpointsTotal = endpoints.length;
                const endpointsWithError = endpoints.filter((e) => !!e.lastError).length;
                const endpointsWithTimeouts = endpoints.filter((e) => e.lastError && e.lastError.indexOf('Timeout') !== -1).length;

                asyncCollectorService.gauge('mashroom_remote_apps_total', 'Mashroom Remote Apps Total').set(endpointsTotal);
                asyncCollectorService.gauge('mashroom_remote_apps_error_total', 'Mashroom Remote Apps With Error').set(endpointsWithError);
                asyncCollectorService.gauge('mashroom_remote_apps_connection_timeout_total', 'Mashroom Remote Apps With Connection Timeout').set(endpointsWithTimeouts);
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterRemoteAppMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
