
import context from '../context';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 10000;

let interval: NodeJS.Timeout;

export const startExportRemoteAppMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            const services = context.registry.services;
            const servicesTotal = services.length;
            const servicesWithError = services.filter((s) => !!s.error).length;
            const servicesWithTimeouts = services.filter((s) => s.error && s.error.indexOf('ETIMEDOUT') !== -1).length;

            collectorService.gauge('mashroom_remote_apps_k8s_total', 'Mashroom Kubernetes Remote Apps Total').set(servicesTotal);
            collectorService.gauge('mashroom_remote_apps_k8s_error', 'Mashroom Kubernetes Remote Apps With Error').set(servicesWithError);
            collectorService.gauge('mashroom_remote_apps_k8s_connection_timeout', 'Mashroom Kubernetes Remote Apps With Connection Timeout').set(servicesWithTimeouts);
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportRemoteAppMetrics = () => {
    clearInterval(interval);
};
