import type {Counter, Histogram, ObservableCounter, ObservableGauge} from '@opentelemetry/api';
import type {ResourceMetrics, MeterProvider} from '@opentelemetry/sdk-metrics';

export type MashroomMonitoringMetricsLabels = Record<string, string | number>;

export type MashroomMonitoringMetricsCounter = {
    /*
     * The underlying OpenTelemetry metric, will be undefined if the metric has been disabled via config
     */
    readonly openTelemetryMetric?: Counter;
    /*
     * Increment by 1 or given value
     */
    inc(by?: number, labels?: MashroomMonitoringMetricsLabels): void;
}

export type MashroomMonitoringMetricsHistogram = {
    /*
     * The underlying OpenTelemetry metric, will be undefined if the metric has been disabled via config
     */
    readonly openTelemetryMetric?: Histogram;
    /*
     * Record the given value
     */
    record(value: number, labels?: MashroomMonitoringMetricsLabels): void;
}

export type MashroomMonitoringMetricsObservableCounter = {
    /*
     * The underlying OpenTelemetry metric, will be undefined if the metric has been disabled via config
     */
    readonly openTelemetryMetric?: ObservableCounter;
    /*
     * Set the counter value (must be higher than the previous one!)
     */
    set(value: number, labels?: MashroomMonitoringMetricsLabels): void;
}

export type MashroomMonitoringMetricsObservableGauge = {
    /*
     * The underlying OpenTelemetry metric, will be undefined if the metric has been disabled via config
     */
    readonly openTelemetryMetric?: ObservableGauge;
    /*
     * Set the gauge value
     */
    set(value: number, labels?: MashroomMonitoringMetricsLabels): void;
}

export interface MashroomMonitoringMetricsCollectorAsyncService {
    /**
     * A counter for am observable value.
     */
    counter(name: string, help: string): MashroomMonitoringMetricsObservableCounter;
    /**
     * A gauge for am observable value.
     * A gauge is a metric that represents a single numerical value that can arbitrarily go up and down.
     */
    gauge(name: string, help: string): MashroomMonitoringMetricsObservableGauge;
}

export type MashroomMonitoringMetricsObservableCallback = (asyncCollectorService: MashroomMonitoringMetricsCollectorAsyncService) => void | Promise<void>;

export type MashroomMonitoringMetricsObservableCallbackRef = {
    removeCallback(): void;
}

/**
 * Mashroom Monitoring Metrics Collector Service
 *
 * An abstraction that uses currently OpenTelemetry Metrics under the hood, see https://opentelemetry.io/docs/specs/otel/metrics/
 */
export interface MashroomMonitoringMetricsCollectorService {
    /**
     * A counter is a cumulative metric that represents a single monotonically increasing counter
     * whose value can only increase.
     * Even though the returned Counter has a set() method, the new value must always be higher than the current.
     */
    counter(name: string, help: string): MashroomMonitoringMetricsCounter;
    /**
     * A histogram samples observations (usually things like request durations or response sizes)
     * and counts them in configurable buckets.It also provides a sum of all observed values.
     */
    histogram(name: string, help: string, buckets?: number[]): MashroomMonitoringMetricsHistogram;
    /**
     * Add a callback for asynchronous measuring of values.
     * Gauges and counters where you can set the value directly are only available like this!
     */
    addObservableCallback(cb: MashroomMonitoringMetricsObservableCallback): Promise<MashroomMonitoringMetricsObservableCallbackRef>;
    /**
     * Get OpenTelemetry resource metrics for export
     */
    getOpenTelemetryResourceMetrics(): Promise<ResourceMetrics>;
    /**
     * The underlying MeterProvider which can be used if you prefer directly using the OpenTelemetry API instead.
     * All metrics created will be automatically exported as well.
     */
    getOpenTelemetryMeterProvider(): MeterProvider;
}
