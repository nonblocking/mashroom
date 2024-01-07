
import type {MeterProvider} from '@opentelemetry/sdk-metrics';
import type {RequestHandler} from 'express';
import type {Counter, Histogram, ObservableCounter, ObservableGauge} from '@opentelemetry/api';

export type OpenTelemetryMeter = ReturnType<MeterProvider['getMeter']>;

export interface MashroomMonitoringRequestMetricsMiddleware {
    middleware(): RequestHandler;
}

export type MashroomMonitoringMetricsCollectorConfig = {
    readonly disableMetrics?: Array<string>;
    readonly defaultHistogramBuckets: number[];
    readonly customHistogramBucketConfig: {
        readonly [metric: string]: number[];
    };
}

type InternalMetricDataBase = {
    readonly name: string;
    readonly help: string;
}

export type InternalCounterMetric = InternalMetricDataBase & {
    readonly type: 'counter';
    readonly openTelemetryMetric: Counter;
}

export type InternalHistogramMetric = InternalMetricDataBase & {
    readonly type: 'histogram';
    readonly openTelemetryMetric: Histogram;
}

export type InternalObservableCounterMetric = InternalMetricDataBase & {
    readonly type: 'observable-counter';
    readonly openTelemetryMetric: ObservableCounter;
}

export type InternalObservableGaugeMetric = InternalMetricDataBase & {
    readonly type: 'observable-gauge';
    readonly openTelemetryMetric: ObservableGauge;
}

export type InternalMetric = InternalCounterMetric | InternalHistogramMetric | InternalObservableCounterMetric | InternalObservableGaugeMetric;

export type InternalMetricsMap = Record<string, InternalMetric>;
