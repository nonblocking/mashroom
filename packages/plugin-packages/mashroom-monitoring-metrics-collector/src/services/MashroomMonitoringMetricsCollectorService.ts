
import counter from './counter';
import gauge from './gauge';
import histogram from './histogram';
import summary from './summary';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    Counter,
    Gauge,
    Histogram,
    Summary,
    MetricDataMap,
    MashroomMonitoringMetricsCollectorService as MashroomMonitoringMetricsCollectorServiceType,
} from '../../type-definitions';
import type {
    InternalCounterMetricData, InternalGaugeMetricData, InternalHistogramMetricData,
    InternalMetricsData, InternalSummaryMetricData,
    MashroomMonitoringMetricsCollectorConfig
} from '../../type-definitions/internal';

export default class MashroomMonitoringMetricsCollectorService implements MashroomMonitoringMetricsCollectorServiceType {

    private _metrics: {
        [name: string]: InternalMetricsData;
    };
    private _logger: MashroomLogger;

    constructor(private _config: MashroomMonitoringMetricsCollectorConfig, loggerFactory: MashroomLoggerFactory) {
        this._metrics = {};
        this._logger = loggerFactory('mashroom.montoring.collector');
    }

    counter(name: string, help: string): Counter {
        name = this._fixMetricName(name);
        if (this._config.disableMetrics && this._config.disableMetrics.includes(name)) {
            this._logger.debug(`Metric ${name} disabled by configuration`);
            return this._createNoOpMetric();
        }
        let metric = this._metrics[name] as InternalCounterMetricData;
        if (!metric) {
            metric = {
                name,
                help,
                type: 'counter',
                data: {},
            };
            this._metrics[name] = metric;
        } else if (metric.type !== 'counter') {
            this._logger.error(`Metric ${name} of type ${this._metrics[name].type} already exists!`);
            return this._createNoOpMetric();
        }
        return counter(metric);
    }

    gauge(name: string, help: string): Gauge {
        name = this._fixMetricName(name);
        if (this._config.disableMetrics && this._config.disableMetrics.includes(name)) {
            this._logger.debug(`Metric ${name} disabled by configuration`);
            return this._createNoOpMetric();
        }
        let metric = this._metrics[name] as InternalGaugeMetricData;
        if (!metric) {
            metric = {
                name,
                help,
                type: 'gauge',
                data: {},
            };
            this._metrics[name] = metric;
        } else if (this._metrics[name].type !== 'gauge') {
            this._logger.error(`Metric ${name} of type ${this._metrics[name].type} already exists!`);
            return this._createNoOpMetric();
        }
        return gauge(metric);
    }

    histogram(name: string, help: string, buckets?: number[]): Histogram {
        name = this._fixMetricName(name);
        if (this._config.disableMetrics && this._config.disableMetrics.includes(name)) {
            this._logger.debug(`Metric ${name} disabled by configuration`);
            return this._createNoOpMetric();
        }
        let metrics = this._metrics[name] as InternalHistogramMetricData;
        if (!metrics) {
            metrics = {
                name,
                help,
                type: 'histogram',
                buckets: [...(this._config.customHistogramBucketConfig && this._config.customHistogramBucketConfig[name]) || buckets || this._config.defaultHistogramBuckets],
                data: {},
            };
            this._metrics[name] = metrics;
        } else if (this._metrics[name].type !== 'histogram') {
            this._logger.error(`Metric ${name} of type ${this._metrics[name].type} already exists!`);
            return this._createNoOpMetric();
        }
        return histogram(metrics);
    }

    summary(name: string, help: string, quantiles?: number[]): Summary {
        name = this._fixMetricName(name);
        if (this._config.disableMetrics && this._config.disableMetrics.includes(name)) {
            this._logger.debug(`Metric ${name} disabled by configuration`);
            return this._createNoOpMetric();
        }
        let metrics = this._metrics[name] as InternalSummaryMetricData;
        if (!metrics) {
            metrics = {
                name,
                help,
                type: 'summary',
                quantiles: [...(this._config.customSummaryQuantileConfig && this._config.customSummaryQuantileConfig[name]) || quantiles || this._config.defaultSummaryQuantiles],
                data: {},
            };
            this._metrics[name] = metrics;
        } else if (this._metrics[name].type !== 'histogram') {
            this._logger.error(`Metric ${name} of type ${this._metrics[name].type} already exists!`);
            return this._createNoOpMetric();
        }
        return summary(metrics);
    }

    getMetrics(): MetricDataMap {
        const metrics: MetricDataMap = {};
        Object.keys(this._metrics).forEach((metricName) => {
            const metricsData = this._metrics[metricName];
            const {name, help, type, data} = metricsData;
            metrics[metricName] = {
                name,
                help,
                type,
                data: [],
            };
            switch (type) {
                case 'summary':
                    const summaryMetricsData = metricsData as InternalSummaryMetricData;
                    metrics[metricName].data = Object.values(summaryMetricsData.data).map(({ sum, count, labels, tDigest }) => {
                        tDigest.compress();
                        return {
                            sum,
                            count,
                            labels,
                            buckets: summaryMetricsData.quantiles.map((quantile) => ({
                                quantile,
                                value: tDigest.percentile(quantile),
                            })),
                        };
                    });
                    break;
                default:
                    metrics[metricName].data = Object.values(data);
                    break;
            }
        });
        return metrics;
    }

    private _fixMetricName(name: string): string {
        return (name || 'undefined').replace(/ /g, '_').toLowerCase();
    }

    private _createNoOpMetric(): Counter & Gauge & Histogram & Summary {
        return {
            inc(): void {
                // Ignore
            },
            set(): void {
                // Ignore
            },
            observe(): void {
                // Ignore
            },
        };
    }
}
