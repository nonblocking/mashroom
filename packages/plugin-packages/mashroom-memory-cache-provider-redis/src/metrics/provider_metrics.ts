
import getClient from '../redis_client';

import type {Cluster, Redis} from 'ioredis';
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportProviderMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            let connected = 0;
            const client = await getClient();
            if (client.hasOwnProperty('status')) {
                const redis = client as Redis;
                connected = redis.status === 'ready' ? 1 : 0;
            } else {
                const nodes = (client as Cluster).nodes();
                connected = nodes.filter((redis) => redis.status === 'ready').length;
            }

            collectorService.gauge('mashroom_memory_cache_redis_nodes_connected', 'Mashroom Memory Cache Redis Nodes Connected').set(connected);
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportProviderMetrics = () => {
    clearInterval(interval);
};
