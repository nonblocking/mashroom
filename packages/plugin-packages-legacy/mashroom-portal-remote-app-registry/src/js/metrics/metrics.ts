
import getRemotePortalAppEndpointStore from '../store/getRemotePortalAppEndpointStore';
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerRemoteAppMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback(async (asyncCollectorService) => {
                const store = await getRemotePortalAppEndpointStore(pluginContextHolder.getPluginContext());
                const {result: endpoints} = await store.find();
                const endpointsTotal = endpoints.length;

                asyncCollectorService.gauge('mashroom_remote_app_endpoints_total', 'Mashroom Remote App Endpoints Total').set(endpointsTotal);
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
