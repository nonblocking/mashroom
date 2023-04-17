
export type MetricLabels = Record<string, string | number>;

export interface Counter {
    inc(by?: number, labels?: MetricLabels): void;
    set(value: number, labels?: MetricLabels): void;
}

export interface Gauge {
    reset(): void;
    set(value: number, labels?: MetricLabels): void;
}

export interface Histogram {
    observe(value: number, labels?: MetricLabels): void;
}

export interface Summary {
    observe(value: number, labels?: MetricLabels): void;
}

export type AggregationHint = 'omit' | 'sum' | 'first' | 'min' | 'max' | 'average';

/**
 * Mashroom Monitoring Metrics Collector Service
 *
 * It uses the metric types defined here: https://prometheus.io/docs/concepts/metric_types
 * and supports also *labels* which can be used to differentiate the characteristics of the thing that is being measured;
 * e.g. to group requests total by the HTTP error code.
 *
 * The AggregationHint can be used if you need to aggregate metrics, e.g. in a Node.js cluster.
 */
export interface MashroomMonitoringMetricsCollectorService {
    /**
     * A counter is a cumulative metric that represents a single monotonically increasing counter
     * whose value can only increase.
     * If though the returned Counter has a set() method, the new value must always be higher than the current.
     */
    counter(name: string, help: string, aggregationHint?: AggregationHint): Counter;
    /**
     * A gauge is a metric that represents a single numerical value that can arbitrarily go up and down.
     */
    gauge(name: string, help: string, aggregationHint?: AggregationHint): Gauge;
    /**
     * A histogram samples observations (usually things like request durations or response sizes)
     * and counts them in configurable buckets.It also provides a sum of all observed values.
     */
    histogram(name: string, help: string, buckets?: number[], aggregationHint?: AggregationHint): Histogram;
    /**
     * Similar to a histogram, a summary samples observations. While it also provides a total count of
     * observations and a sum of all observed values, it calculates configurable quantiles..
     */
    summary(name: string, help: string, quantiles?: number[], aggregationHint?: AggregationHint): Summary;
    /**
     * Get the collected metrics
     */
    getMetrics(): MetricDataMap;
}

export type MetricDataMap = {
    [name: string]: MetricsData;
}

type MetricDataBase = {
    name: string;
    help: string;
}

export type CounterMetricData = MetricDataBase & {
    type: 'counter';
    aggregationHint: AggregationHint;
    data: Array<{
        value: number;
        labels: MetricLabels;
    }>;
}

export type GaugeMetricData = MetricDataBase & {
    type: 'gauge';
    aggregationHint: AggregationHint;
    data: Array<{
        value: number;
        labels: MetricLabels;
    }>;
}

export type HistogramMetricData = MetricDataBase & {
    type: 'histogram';
    aggregationHint: AggregationHint;
    data: Array<{
        count: number;
        sum: number;
        buckets: Array<{
            le: number;
            value: number;
        }>;
        labels: MetricLabels;
    }>;
}

export type SummaryMetricData = MetricDataBase & {
    type: 'summary';
    aggregationHint: AggregationHint;
    data: Array<{
        count: number;
        sum: number;
        buckets: Array<{
            quantile: number;
            value: number;
        }>;
        labels: MetricLabels;
    }>;
}

export type MetricsData = CounterMetricData | GaugeMetricData | HistogramMetricData | SummaryMetricData;

