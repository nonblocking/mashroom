
import getRemotePluginPackageEndpointStore from '../store/getRemotePluginPackageEndpointStore';
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerRemotePluginPackagesMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback(async (asyncCollectorService) => {
                const store = await getRemotePluginPackageEndpointStore(pluginContextHolder.getPluginContext());
                const {result: endpoints} = await store.find();
                const endpointsTotal = endpoints.length;

                asyncCollectorService.gauge('mashroom_remote_plugin_packages_total', 'Mashroom Remote Plugin Packages Total').set(endpointsTotal);
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterRemotePluginPackagesMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
