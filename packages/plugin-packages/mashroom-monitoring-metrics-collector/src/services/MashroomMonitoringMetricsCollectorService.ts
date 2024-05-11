import {diag, DiagLogLevel} from '@opentelemetry/api';
import {MeterProvider} from '@opentelemetry/sdk-metrics';
import {Resource} from '@opentelemetry/resources';
import {SEMRESATTRS_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {OpenTelemetryMetricReader} from './OpenTelemetryMetricReader';

import type {BatchObservableResult, Observable} from '@opentelemetry/api';
import type {MetricReader, ResourceMetrics} from '@opentelemetry/sdk-metrics';
import type {
    MashroomMonitoringMetricsCollectorService as MashroomMonitoringMetricsCollectorServiceType,
    MashroomMonitoringMetricsCounter,
    MashroomMonitoringMetricsHistogram,
    MashroomMonitoringMetricsLabels,
    MashroomMonitoringMetricsObservableCallback,
    MashroomMonitoringMetricsObservableCallbackRef,
    MashroomMonitoringMetricsObservableCounter,
    MashroomMonitoringMetricsObservableGauge,
} from '../../type-definitions';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    InternalCounterMetric,
    InternalHistogramMetric,
    InternalMetricsMap,
    InternalObservableCounterMetric,
    InternalObservableGaugeMetric,
    MashroomMonitoringMetricsCollectorConfig,
    OpenTelemetryMeter,
} from '../../type-definitions/internal';

type ObservableCreateSetValue = (observable: Observable) => (value: number, labels?: MashroomMonitoringMetricsLabels) => void;

const RESOURCE_NAME = 'mashroom-server';
const DEFAULT_METER_NAME = 'mashroom-monitoring-collector-service';

export default class MashroomMonitoringMetricsCollectorService implements MashroomMonitoringMetricsCollectorServiceType {

    private readonly _meterProvider: MeterProvider;
    private readonly _defaultMeter: OpenTelemetryMeter;
    private readonly _defaultMeterRemoveCallbacksFns: Array<() => void>;
    private readonly _metricReader: MetricReader;
    private readonly _metrics: InternalMetricsMap;
    private readonly _logger: MashroomLogger;

    constructor(private _config: MashroomMonitoringMetricsCollectorConfig, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.monitoring.collector');
        diag.setLogger({
            verbose() {},
            debug() {},
            info() {},
            warn: this._logger.warn,
            error: this._logger.error,
        }, DiagLogLevel.WARN);

        this._meterProvider = new MeterProvider({
            resource: Resource.empty().merge(
                new Resource({
                    [SEMRESATTRS_SERVICE_NAME]: RESOURCE_NAME,
                })
            )
        });
        this._metricReader = new OpenTelemetryMetricReader();
        this._meterProvider.addMetricReader(this._metricReader);
        this._defaultMeter = this._meterProvider.getMeter(DEFAULT_METER_NAME);
        this._defaultMeterRemoveCallbacksFns = [];
        this._metrics = {};
    }

    counter(name: string, help: string): MashroomMonitoringMetricsCounter {
        name = this._fixMetricName(name);
        if (this._config.disableMetrics && this._config.disableMetrics.includes(name)) {
            this._logger.debug(`Metric ${name} disabled by configuration`);
            return this._createNoOpMetric();
        }
        let metric = this._metrics[name] as InternalCounterMetric;
        if (!metric) {
            metric = {
                name,
                help,
                type: 'counter',
                openTelemetryMetric: this._defaultMeter.createCounter(name, {
                   description: help,
                }),
            };
            this._metrics[name] = metric;
        } else if (metric.type !== 'counter') {
            this._logger.error(`Duplicate metric ${name} of type ${this._metrics[name].type} already exists!`);
            return this._createNoOpMetric();
        }
        const {openTelemetryMetric} = metric;
        return {
            openTelemetryMetric,
            inc(by?: number, labels?: MashroomMonitoringMetricsLabels) {
                openTelemetryMetric.add(by ?? 1, labels);
            }
        };
    }

    histogram(name: string, help: string, buckets?: number[]): MashroomMonitoringMetricsHistogram {
        name = this._fixMetricName(name);
        if (this._config.disableMetrics && this._config.disableMetrics.includes(name)) {
            this._logger.debug(`Metric ${name} disabled by configuration`);
            return this._createNoOpMetric();
        }
        let metric = this._metrics[name] as InternalHistogramMetric;
        if (!metric) {
            const explicitBucketBoundaries = (this._config.customHistogramBucketConfig?.[name]) ?? buckets ??  this._config.defaultHistogramBuckets;
            metric = {
                name,
                help,
                type: 'histogram',
                openTelemetryMetric: this._defaultMeter.createHistogram(name, {
                    description: help,
                    advice: {
                        explicitBucketBoundaries,
                    }
                }),
            };
            this._metrics[name] = metric;
        } else if (this._metrics[name].type !== 'histogram') {
            this._logger.error(`Duplicate metric ${name} of type ${this._metrics[name].type} already exists!`);
            return this._createNoOpMetric();
        }
        const {openTelemetryMetric} = metric;
        return {
            openTelemetryMetric,
            record(value: number, labels?: MashroomMonitoringMetricsLabels) {
                openTelemetryMetric.record(value, labels);
            },
        };
    }

    private observableCounter(createSetValue: ObservableCreateSetValue, name: string, help: string): MashroomMonitoringMetricsObservableCounter {
        name = this._fixMetricName(name);
        if (this._config.disableMetrics && this._config.disableMetrics.includes(name)) {
            this._logger.debug(`Metric ${name} disabled by configuration`);
            return this._createNoOpMetric();
        }
        let metric = this._metrics[name] as InternalObservableCounterMetric;
        if (!metric) {
            metric = {
                name,
                help,
                type: 'observable-counter',
                openTelemetryMetric: this._defaultMeter.createObservableCounter(name, {
                    description: help,
                }),
            };
            this._metrics[name] = metric;
        } else if (this._metrics[name].type !== 'observable-counter') {
            this._logger.error(`Duplicate metric ${name} of type ${this._metrics[name].type} already exists!`);
            return this._createNoOpMetric();
        }
        const {openTelemetryMetric} = metric;
        return {
            openTelemetryMetric,
            set: createSetValue(openTelemetryMetric),
        };
    }

    private observableGauge(createSetValue: ObservableCreateSetValue, name: string, help: string): MashroomMonitoringMetricsObservableGauge {
        name = this._fixMetricName(name);
        if (this._config.disableMetrics && this._config.disableMetrics.includes(name)) {
            this._logger.debug(`Metric ${name} disabled by configuration`);
            return this._createNoOpMetric();
        }
        let metric = this._metrics[name] as InternalObservableGaugeMetric;
        if (!metric) {
            metric = {
                name,
                help,
                type: 'observable-gauge',
                openTelemetryMetric: this._defaultMeter.createObservableGauge(name, {
                    description: help,
                }),
            };
            this._metrics[name] = metric;
        } else if (this._metrics[name].type !== 'observable-gauge') {
            this._logger.error(`Duplicate metric ${name} of type ${this._metrics[name].type} already exists!`);
            return this._createNoOpMetric();
        }
        const {openTelemetryMetric} = metric;
        return {
            openTelemetryMetric,
            set: createSetValue(openTelemetryMetric),
        };
    }

    async addObservableCallback(cb: MashroomMonitoringMetricsObservableCallback): Promise<MashroomMonitoringMetricsObservableCallbackRef> {
        let removeCallback = () => { /* no-op */};
        // Step 1: execute the callback to get all observables
        const observables: Array<Observable> = [];
        try {
            const createSetValue: ObservableCreateSetValue = (observable) => {
                observables.push(observable);
                return () => { /* no-op */ };
            };
            await cb({
                counter: this.observableCounter.bind(this, createSetValue),
                gauge: this.observableGauge.bind(this, createSetValue),
            });
        } catch (e) {
            this._logger.error('Executing observable callback failed:', e);
            return {
                removeCallback,
            };
        }

        // Step two: Register a batchObservableCallback with the created observables
        if (observables.length > 0) {
            const openTelemetryCb = (observableResult: BatchObservableResult) => {
                const createSetValue: ObservableCreateSetValue = (observable) => {
                    return (value, labels) => observableResult.observe(observable, value, labels);
                };
                return cb({
                    counter: this.observableCounter.bind(this, createSetValue),
                    gauge: this.observableGauge.bind(this, createSetValue),
                });
            };
            this._defaultMeter.addBatchObservableCallback(openTelemetryCb, observables);
            removeCallback = () => this._defaultMeter.removeBatchObservableCallback(openTelemetryCb, observables);
            this._defaultMeterRemoveCallbacksFns.push(removeCallback);
        }
        return {
          removeCallback,
        };
    }

    async getOpenTelemetryResourceMetrics(): Promise<ResourceMetrics> {
        const collectionResult = await this._metricReader.collect({
            timeoutMillis: 2500,
        });
        if (collectionResult.errors.length > 0) {
            this._logger.error('Metric serialization errors:', collectionResult.errors);
        }
        return collectionResult.resourceMetrics;
    }

    getOpenTelemetryMeterProvider(): MeterProvider {
        return this._meterProvider;
    }

    shutdown()  {
        // Unregister all callbacks
        this._defaultMeterRemoveCallbacksFns.forEach((fn) => fn());
        this._metricReader.shutdown();
    };

    private _fixMetricName(name: string): string {
        return (name || 'undefined').replace(/[ -]/g, '_').toLowerCase();
    }

    private _createNoOpMetric(): MashroomMonitoringMetricsCounter & MashroomMonitoringMetricsHistogram & MashroomMonitoringMetricsObservableCounter & MashroomMonitoringMetricsObservableGauge {
        return {
            inc() {
                // Ignore
            },
            record() {
                // Ignore
            },
            set() {
                // Ignore
            }
        };
    }
}
