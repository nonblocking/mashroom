import pm2 from '@pm2/io';

import {DataPointType} from '@opentelemetry/sdk-metrics';

import type PM2Gauge from '@pm2/io/build/main/utils/metrics/gauge';
import type {ResourceMetrics, MetricData, GaugeMetricData, SumMetricData} from '@opentelemetry/sdk-metrics';
import type {
    MashroomMonitoringMetricsCollectorService,
    MashroomMonitoringMetricsLabels
} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {Config} from '../type-definitions';

type PM2Metrics = {
    [name: string]: PM2Gauge;
}

const EXPORT_INTERVAL_MS = 10 * 1000;

const pm2Metrics: PM2Metrics = {};
let interval: NodeJS.Timeout;

export const startExport = (config: Config, contextHolder: MashroomPluginContextHolder) => {
    pm2.init({
        metrics: config.pmxMetrics,
    });
    interval = setInterval(() => exportMetrics(config, contextHolder), EXPORT_INTERVAL_MS);
};

export const stopExport = () => {
    if (interval) {
        clearInterval(interval);
    }
    pm2.destroy();
};

const getMetricName = (name: string, labels: MashroomMonitoringMetricsLabels): string => {
    if (!labels || Object.keys(labels).length === 0) {
        return name;
    }

    // name[key1=value1,key2=value2]
    return `${name}[${Object.keys(labels).map((key) => `${key}=${labels[key]}`).join(',')}]`;
};

const exportMetrics = async (config: Config, contextHolder: MashroomPluginContextHolder) => {
    const pluginContext = contextHolder.getPluginContext();
    const logger = pluginContext.loggerFactory('mashroom.monitoring.pm2.export');
    const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics!.service;

    try {
        const resourceMetrics = await collectorService.getOpenTelemetryResourceMetrics();
        exportOpenTelemetryMetrics(config, resourceMetrics, logger);
    } catch (e) {
        logger.error('Exporting metrics to PM2 failed!', e);
    }
};

export const exportOpenTelemetryMetrics = (config: Config, resourceMetrics: ResourceMetrics, logger: MashroomLogger) => {
    // Gather all metric data
    const metricData: Array<MetricData> = [];
    resourceMetrics.scopeMetrics.forEach((scopeMetric) => {
        metricData.push(...scopeMetric.metrics);
    });

    metricData.forEach((metric) => {
        const metricName = metric.descriptor.name;
        if (config.mashroomMetrics.includes(metricName)) {
            if (metric.dataPointType === DataPointType.SUM || metric.dataPointType === DataPointType.GAUGE) {
                const gaugeData = metric as GaugeMetricData | SumMetricData;
                gaugeData.dataPoints.forEach(({ value, attributes }) => {
                    const fullMetricName = getMetricName(metricName, attributes as MashroomMonitoringMetricsLabels);
                    let pm2Metric = pm2Metrics[fullMetricName];
                    if (!pm2Metric) {
                        pm2Metric = pm2.metric({
                            name: fullMetricName,
                        });
                        pm2Metrics[fullMetricName] = pm2Metric;
                    }
                    pm2Metric.set(value);
                });

            } else {
                logger.warn(`The metric ${metricName} is of type ${metric.dataPointType} and cannot be exported (only type counter and gauge are supported)`);
            }
        }
    });
};

export const getPM2Metrics = () => pm2Metrics;
