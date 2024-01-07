
import {getSessionCount} from '../middleware/MashroomSessionMiddleware';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService, MashroomMonitoringMetricsObservableCallbackRef} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

let callbackRef: MashroomMonitoringMetricsObservableCallbackRef | undefined;

export const registerSessionMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    const register = async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics?.service;
        if (collectorService) {
            callbackRef = await collectorService.addObservableCallback(async (asyncCollectorService) => {
                let sessionsTotal = -1;
                try {
                    const count = await getSessionCount();
                    if (typeof (count) === 'number') {
                        sessionsTotal = count;
                    }
                } catch (e) {
                    // Ignore
                }
                asyncCollectorService.gauge('mashroom_sessions_total', `Mashroom Express Sessions Total (-1 means the store doesn't support the length() operation)`).set(sessionsTotal);
            });
        }
    };
    // Wait a few seconds until collectorService is available
    setTimeout(register, 5000);
};

export const unregisterSessionMetrics = () => {
    if (callbackRef) {
        callbackRef.removeCallback();
        callbackRef = undefined;
    }
};
