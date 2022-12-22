
import {Registry} from 'prom-client';
import PromClientMashroomMetricsAdapter from './PromClientMashroomMetricsAdapter';
import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomMonitoringMetricsCollectorService
} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const registry = new Registry();

let interval: NodeJS.Timer;
const existingAdapters: {
    [metricName: string]: PromClientMashroomMetricsAdapter;
} = {};

export const startSyncRegistry = (pluginContext: MashroomPluginContext) => {
    const logger = pluginContext.loggerFactory('mashroom.monitoring.prometheus');
    interval = setInterval(() => {
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics!.service;
        const metrics = collectorService.getMetrics();
        Object.keys(metrics).forEach((metricName) => {
            try {
                const metricsData = metrics[metricName];
                let adapter = existingAdapters[metricName];
                if (!adapter) {
                    adapter = new PromClientMashroomMetricsAdapter(metricName);
                    existingAdapters[metricName] = adapter;
                    registry.registerMetric(adapter as any);
                }
                adapter.setMetrics(metricsData);
            } catch (e) {
                logger.error(`Couldn't add metric ${metricName} to Prometheus!`, e);
            }
        });

    }, 10000);
};

export const stopSyncRegistry = () => {
    if (interval) {
        clearInterval(interval);
    }
};

export default registry;
