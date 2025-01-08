
import context from '../context';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerRemoteAppMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                const services = context.registry.services;
                const servicesTotal = services.length;
                const servicesError = services.filter((s) => !!s.error).length;
                const servicesNoPluginDefinition = services.filter((s) => s.error && s.error.indexOf('No plugin definition found') !== -1).length;
                const servicesConnectionFailed = services.filter((s) => s.error && s.error.indexOf('ECONNREFUSED') !== -1).length;
                const servicesTimeout = services.filter((s) => s.error && s.error.indexOf('Timeout') !== -1).length;

                asyncCollectorService.gauge('mashroom_remote_app_k8s_services_total', 'Mashroom Remote App Kubernetes Services Total').set(servicesTotal);
                asyncCollectorService.gauge('mashroom_remote_app_k8s_services_error_total', 'Mashroom Remote App Kubernetes Services With Error').set(servicesError);
                asyncCollectorService.gauge('mashroom_remote_app_k8s_services_no_plugin_definition_total', 'Mashroom Remote App Kubernetes Services With Missing Plugin Definition').set(servicesNoPluginDefinition);
                asyncCollectorService.gauge('mashroom_remote_app_k8s_services_connection_failed_total', 'Mashroom Remote App Kubernetes Services With Connection Failure').set(servicesConnectionFailed);
                asyncCollectorService.gauge('mashroom_remote_app_k8s_services_connection_timeout_total', 'Mashroom Remote App Kubernetes Services With Connection Timeout').set(servicesTimeout);
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
