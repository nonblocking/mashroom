
import {getAvailableNodes} from '../redis_client';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportProviderMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            const availableNodes = getAvailableNodes();
            collectorService.gauge('mashroom_messaging_redis_connected', 'Mashroom Messaging Redis Connected').set(availableNodes);
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportProviderMetrics = () => {
    clearInterval(interval);
};