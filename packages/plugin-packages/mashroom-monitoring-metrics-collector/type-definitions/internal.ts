
import type {ExpressMiddleware} from '@mashroom/mashroom/type-definitions';
import {MetricLabels} from './api';

import type {TDigest} from 'tdigest';

export interface MashroomMonitoringRequestMetricsMiddleware {
    middleware(): ExpressMiddleware;
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
    data: {
        [hash: string]: {
            value: number;
            labels: MetricLabels;
        };
    };
}

export type InternalGaugeMetricData = InternalMetricDataBase & {
    type: 'gauge';
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


