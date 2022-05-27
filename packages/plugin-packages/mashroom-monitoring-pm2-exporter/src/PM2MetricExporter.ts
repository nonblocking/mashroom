
import pm2 from '@pm2/io';
import type Gauge from '@pm2/io/build/main/utils/metrics/gauge';
import type {MashroomMonitoringMetricsCollectorService, CounterMetricData, GaugeMetricData, MetricLabels} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {Config, PM2MetricExporter as PM2MetricExporterType} from '../type-definitions';

const EXPORT_INTERVAL_MS = 10 * 1000;

export default class PM2MetricExporter implements PM2MetricExporterType {

    private _intervalId: ReturnType<typeof setInterval> | undefined;
    private _pm2Metrics: {
        [name: string]: Gauge;
    };

    constructor(private _config: Config, private _contextHolder: MashroomPluginContextHolder) {
        this._pm2Metrics = {};
    }

    start(): void {
        pm2.init({
            metrics: this._config.pmxMetrics,
        });
        this._intervalId = setInterval(() => this._exportMashroomMetrics(), EXPORT_INTERVAL_MS);
    }

    stop(): void {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
        pm2.destroy();
    }

    private _exportMashroomMetrics(): void {
        const logger = this._contextHolder.getPluginContext().loggerFactory('mashroom.monitoring.pm2');
        const collectorService: MashroomMonitoringMetricsCollectorService = this._contextHolder.getPluginContext().services.metrics.service;

        const mashroomMetrics = collectorService.getMetrics();
        Object.keys(mashroomMetrics).forEach((metricName) => {
            if (this._config.mashroomMetrics.includes(metricName)) {
                const mashroomMetric = mashroomMetrics[metricName];
                if (mashroomMetric.type === 'counter' || mashroomMetric.type === 'gauge') {
                    const metric: CounterMetricData | GaugeMetricData = mashroomMetric;
                    const metricData = metric.data;

                    metricData.forEach(({ value, labels }) => {
                        const fullMetricName = this._getMetricName(metricName, labels);
                        let pm2Metric = this._pm2Metrics[fullMetricName];
                        if (!pm2Metric) {
                            pm2Metric = pm2.metric({
                                name: fullMetricName,
                            });
                            this._pm2Metrics[fullMetricName] = pm2Metric;
                        }
                        pm2Metric.set(value);
                    });

                } else {
                    logger.warn(`The metric ${metricName} is of type ${mashroomMetric.type} and cannot be exported (only type counter and gauge are supported)`);
                }
            }
        });
    }

    private _getMetricName(name: string, labels: MetricLabels): string {
        if (!labels || Object.keys(labels).length === 0) {
            return name;
        }

        // name[key1=value1,key2=value2]
        return `${name}[${Object.keys(labels).map((key) => `${key}=${labels[key]}`).join(',')}]`;
    }
}
