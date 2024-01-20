
import context from '../context';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerRemoteAppMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                const services = context.registry.services;
                const servicesTotal = services.length;
                const servicesWithError = services.filter((s) => !!s.error).length;
                const servicesWithTimeouts = services.filter((s) => s.error && s.error.indexOf('Timeout') !== -1).length;

                asyncCollectorService.gauge('mashroom_remote_apps_k8s_total', 'Mashroom Kubernetes Remote Apps Total').set(servicesTotal);
                asyncCollectorService.gauge('mashroom_remote_apps_k8s_error_total', 'Mashroom Kubernetes Remote Apps With Error').set(servicesWithError);
                asyncCollectorService.gauge('mashroom_remote_apps_k8s_connection_timeout_total', 'Mashroom Kubernetes Remote Apps With Connection Timeout').set(servicesWithTimeouts);
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
