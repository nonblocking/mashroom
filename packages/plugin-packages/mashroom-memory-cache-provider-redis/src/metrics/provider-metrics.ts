
import {getAvailableNodes} from '../redis-client';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerProviderMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService | undefined = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback((asyncCollectorService) => {
                const availableNodes = getAvailableNodes();
                asyncCollectorService.gauge('mashroom_memory_cache_redis_nodes_connected', 'Mashroom Memory Cache Redis Nodes Connected').set(availableNodes);
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};


export const unregisterProviderMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
