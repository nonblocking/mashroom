
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomPortalRemoteAppEndpointService} from '../../../type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerRemoteAppMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback(async (asyncCollectorService) => {
                const pluginContext = pluginContextHolder.getPluginContext();
                const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = pluginContext.services.remotePortalAppEndpoint!.service;
                const endpoints = await portalRemoteAppEndpointService.findAll();
                const endpointsTotal = endpoints.length;
                const endpointsError = endpoints.filter((e) => !!e.lastError).length;
                const endpointsNoPluginDefinition = endpoints.filter((e) => e.lastError && e.lastError.indexOf('No plugin definition found') !== -1).length;
                const endpointsConnectionFailed = endpoints.filter((e) => e.lastError && e.lastError.indexOf('ECONNREFUSED') !== -1).length;
                const endpointsTimeout = endpoints.filter((e) => e.lastError && e.lastError.indexOf('Timeout') !== -1).length;

                asyncCollectorService.gauge('mashroom_remote_app_endpoints_total', 'Mashroom Remote App Endpoints Total').set(endpointsTotal);
                asyncCollectorService.gauge('mashroom_remote_app_endpoints_error_total', 'Mashroom Remote App Endpoints With Error').set(endpointsError);
                asyncCollectorService.gauge('mashroom_remote_app_endpoints_no_plugin_definition_total', 'Mashroom Remote App Endpoints With Missing Plugin Definition').set(endpointsNoPluginDefinition);
                asyncCollectorService.gauge('mashroom_remote_app_endpoints_connection_failed_total', 'Mashroom Remote App Endpoints With Connection Failure').set(endpointsConnectionFailed);
                asyncCollectorService.gauge('mashroom_remote_app_endpoints_connection_timeout_total', 'Mashroom Remote App Endpoints With Connection Timeout').set(endpointsTimeout);
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
