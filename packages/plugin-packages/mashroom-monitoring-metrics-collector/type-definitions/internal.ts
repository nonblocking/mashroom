
import type {RequestHandler} from 'express';
import type {TDigest} from 'tdigest';
import type {MetricLabels, AggregationHint} from './api';

export interface MashroomMonitoringRequestMetricsMiddleware {
    middleware(): RequestHandler;
}

export type MashroomMonitoringMetricsCollectorConfig = {
    disableMetrics?: Array<string>;
    defaultHistogramBuckets: number[];
    customHistogramBucketConfig: {
        [metric: string]: number[];
    };
    defaultSummaryQuantiles: number[];
    customSummaryQuantileConfig: {
        [metric: string]: number[];
    };
}

type InternalMetricDataBase = {
    name: string;
    help: string;
}

export type InternalCounterMetricData = InternalMetricDataBase & {
    type: 'counter';
    aggregationHint: AggregationHint;
    data: {
        [hash: string]: {
            value: number;
            labels: MetricLabels;
        };
    };
}

export type InternalGaugeMetricData = InternalMetricDataBase & {
    type: 'gauge';
    aggregationHint: AggregationHint;
    data: {
        [hash: string]: {
            value: number;
            labels: MetricLabels;
        };
    };
}

export type InternalHistogramMetricData = InternalMetricDataBase & {
    type: 'histogram';
    buckets: number[];
    aggregationHint: AggregationHint;
    data: {
        [hash: string]: {
            count: number;
            sum: number;
            buckets: Array<{
                le: number;
                value: number;
            }>;
            labels: MetricLabels;
        };
    };
}

export type InternalSummaryMetricData = InternalMetricDataBase & {
    type: 'summary';
    quantiles: number[];
    aggregationHint: AggregationHint;
    data: {
        [hash: string]: {
            count: number;
            sum: number;
            tDigest: TDigest;
            labels: MetricLabels;
        };
    };
}

export type InternalMetricsData = InternalCounterMetricData | InternalGaugeMetricData | InternalHistogramMetricData | InternalSummaryMetricData;


