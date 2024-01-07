
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomMemoryCacheServiceWithStats} from '../../type-definitions/internal';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerMemoryCacheMetrics = (memoryCacheService: MashroomMemoryCacheServiceWithStats, pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;
        callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
            const stats = memoryCacheService.getStats();

            asyncCollectorService.counter('mashroom_memory_cache_regions_total', 'Memory Cache Total Cache Regions').set(stats.regionCount);
            asyncCollectorService.counter('mashroom_memory_cache_entries_added_total', 'Memory Cache Total Entries Added to Cache').set(stats.entriesAdded);
            asyncCollectorService.gauge('mashroom_memory_cache_hit_ratio', 'Memory Cache Hit Ratio').set(stats.cacheHitRatio);
        });
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterMemoryCacheMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
