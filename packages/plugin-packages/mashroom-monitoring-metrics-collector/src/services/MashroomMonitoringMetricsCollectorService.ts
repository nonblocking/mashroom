
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

    private metrics: {
        [name: string]: InternalMetricsData;
    }
    private logger: MashroomLogger;

    constructor(private config: MashroomMonitoringMetricsCollectorConfig, loggerFactory: MashroomLoggerFactory) {
        this.metrics = {};
        this.logger = loggerFactory('mashroom.montoring.collector');
    }

    counter(name: string, help: string): Counter {
        if (this.config.disableMetrics && this.config.disableMetrics.includes(name)) {
            this.logger.debug(`Metric ${name} disabled by configuration`);
            return this.createNoOpMetric();
        }
        let metric = this.metrics[name] as InternalCounterMetricData;
        if (!metric) {
            metric = {
                name,
                help,
                type: 'counter',
                data: {},
            };
            this.metrics[name] = metric;
        } else if (metric.type !== 'counter') {
            this.logger.error(`Metric ${name} of type ${this.metrics[name].type} already exists!`);
            return this.createNoOpMetric();
        }
        return counter(metric);
    }

    gauge(name: string, help: string): Gauge {
        if (this.config.disableMetrics && this.config.disableMetrics.includes(name)) {
            this.logger.debug(`Metric ${name} disabled by configuration`);
            return this.createNoOpMetric();
        }
        let metric = this.metrics[name] as InternalGaugeMetricData;
        if (!metric) {
            metric = {
                name,
                help,
                type: 'gauge',
                data: {},
            };
            this.metrics[name] = metric;
        } else if (this.metrics[name].type !== 'gauge') {
            this.logger.error(`Metric ${name} of type ${this.metrics[name].type} already exists!`);
            return this.createNoOpMetric();
        }
        return gauge(metric);
    }

    histogram(name: string, help: string, buckets?: number[]): Histogram {
        if (this.config.disableMetrics && this.config.disableMetrics.includes(name)) {
            this.logger.debug(`Metric ${name} disabled by configuration`);
            return this.createNoOpMetric();
        }
        let metrics = this.metrics[name] as InternalHistogramMetricData;
        if (!metrics) {
            metrics = {
                name,
                help,
                type: 'histogram',
                buckets: [...(this.config.customHistogramBucketConfig && this.config.customHistogramBucketConfig[name]) || buckets || this.config.defaultHistogramBuckets],
                data: {},
            };
            this.metrics[name] = metrics;
        } else if (this.metrics[name].type !== 'histogram') {
            this.logger.error(`Metric ${name} of type ${this.metrics[name].type} already exists!`);
            return this.createNoOpMetric();
        }
        return histogram(metrics);
    }

    summary(name: string, help: string, quantiles?: number[]): Summary {
        if (this.config.disableMetrics && this.config.disableMetrics.includes(name)) {
            this.logger.debug(`Metric ${name} disabled by configuration`);
            return this.createNoOpMetric();
        }
        let metrics = this.metrics[name] as InternalSummaryMetricData;
        if (!metrics) {
            metrics = {
                name,
                help,
                type: 'summary',
                quantiles: [...(this.config.customSummaryQuantileConfig && this.config.customSummaryQuantileConfig[name]) || quantiles || this.config.defaultSummaryQuantiles],
                data: {},
            };
            this.metrics[name] = metrics;
        } else if (this.metrics[name].type !== 'histogram') {
            this.logger.error(`Metric ${name} of type ${this.metrics[name].type} already exists!`);
            return this.createNoOpMetric();
        }
        return summary(metrics);
    }

    getMetrics(): MetricDataMap {
        const metrics: MetricDataMap = {};
        Object.keys(this.metrics).forEach((metricName) => {
            const metricsData = this.metrics[metricName];
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
        })
        return metrics;
    }

    private createNoOpMetric(): Counter & Gauge & Histogram & Summary {
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
