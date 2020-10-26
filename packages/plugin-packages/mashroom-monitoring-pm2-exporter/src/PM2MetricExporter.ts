
import pm2 from '@pm2/io';
import type Gauge from '@pm2/io/build/main/utils/metrics/gauge';
import type {MashroomMonitoringMetricsCollectorService, CounterMetricData, GaugeMetricData, MetricLabels} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {Config, PM2MetricExporter as PM2MetricExporterType} from '../type-definitions';

const EXPORT_INTERVAL_MS = 10 * 1000;

export default class PM2MetricExporter implements PM2MetricExporterType {

    private intervalId: ReturnType<typeof setInterval> | undefined;
    private pm2Metrics: {
        [name: string]: Gauge;
    }

    constructor(private config: Config, private contextHolder: MashroomPluginContextHolder) {
        this.pm2Metrics = {};
    }

    start(): void {
        pm2.init({
            metrics: this.config.pmxMetrics,
        })
        this.intervalId = setInterval(() => this.exportMashroomMetrics(), EXPORT_INTERVAL_MS);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        pm2.destroy();
    }

    private exportMashroomMetrics(): void {
        const logger = this.contextHolder.getPluginContext().loggerFactory('mashroom.monitoring.pm2');
        const collectorService: MashroomMonitoringMetricsCollectorService = this.contextHolder.getPluginContext().services.metrics.service;

        const mashroomMetrics = collectorService.getMetrics();
        Object.keys(mashroomMetrics).forEach((metricName) => {
            if (this.config.mashroomMetrics.includes(metricName)) {
                const mashroomMetric = mashroomMetrics[metricName];
                if (mashroomMetric.type === 'counter' || mashroomMetric.type === 'gauge') {
                    const metric: CounterMetricData | GaugeMetricData = mashroomMetric;
                    const metricData = metric.data;

                    metricData.forEach(({ value, labels }) => {
                        const fullMetricName = this.getMetricName(metricName, labels);
                        let pm2Metric = this.pm2Metrics[fullMetricName];
                        if (!pm2Metric) {
                            pm2Metric = pm2.metric({
                                name: fullMetricName,
                            });
                            this.pm2Metrics[fullMetricName] = pm2Metric;
                        }
                        pm2Metric.set(value);
                    });

                } else {
                    logger.warn(`The metric ${metricName} is of type ${mashroomMetric.type} and cannot be exported (only type counter and gauge are supported)`);
                }
            }
        });
    }

    private getMetricName(name: string, labels: MetricLabels): string {
        if (!labels || Object.keys(labels).length === 0) {
            return name;
        }

        // name[key1=value1,key2=value2]
        return `${name}[${Object.keys(labels).map((key) => `${key}=${labels[key]}`).join(',')}]`;
    }
}
