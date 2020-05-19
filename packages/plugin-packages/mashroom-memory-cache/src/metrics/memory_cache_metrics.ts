
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomMemoryCacheServiceWithStats} from '../../type-definitions/internal';

const EXPORT_INTERVAL_MS = 10000;

let interval: NodeJS.Timeout;

export const startExportMemoryCacheMetrics = (memoryCacheService: MashroomMemoryCacheServiceWithStats, pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics.service;

        const stats = memoryCacheService.getStats();

        collectorService.counter('mashroom_memory_cache_regions_total', 'Memory Cache Total Cache Regions').set(stats.regionCount);
        collectorService.counter('mashroom_memory_cache_entries_added_total', 'Memory Cache Total Entries Added to Cache').set(stats.entriesAdded);
        collectorService.gauge('mashroom_memory_cache_hit_ratio', 'Memory Cache Hit Ratio').set(stats.cacheHitRatio);

    }, EXPORT_INTERVAL_MS);
}

export const stopExportMemoryCacheMetrics = () => {
    clearInterval(interval);
};
