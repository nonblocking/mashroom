
# Mashroom Monitoring Metrics Collector

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin provides a service to add metrics to the monitoring system that can be used by plugins.
It also adds a middleware that collects request metrics like duration and HTTP status.

It uses internally the [OpenTelemetry SDK](https://opentelemetry.io/docs/specs/otel/metrics/).

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-monitoring-stats-collector** as *dependency*.

You can change the default configuration in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Monitoring Metrics Collector Services": {
            "disableMetrics": [],
            "defaultHistogramBuckets": [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            "customHistogramBucketConfig": {
              "mashroom_http_request_duration_seconds": [0.1, 1, 10]
            }
        }
    }
}
```

 * _disableMetrics_: A list of metrics that should be disabled
 * _defaultHistogramBuckets_: Default buckets for histogram metrics
   * _customHistogramBucketConfig_: Override the bucket configuration for histogram metrics

### Synchronous example:

```typescript
    const collectorService: MashroomMonitoringMetricsCollectorService = req.pluginContext.services.metrics.service;

    collectorService.counter('http_request_counter', 'HTTP Request Counter').inc();
```
### Asynchronous example:

```typescript
    const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics.service;

    const ref = await collectorService.addObservableCallback((asyncCollectorService) => {
        // ... somehow get the value to measure
        asyncCollectorService.gauge('http_pool_active_connections', 'HTTP Pool Active Connections').set(theValue);
    });
```
### Using directly the OpenTelemetry API

If you prefer the OpenTelemetry API the above examples would look like:

```typescript
    const collectorService: MashroomMonitoringMetricsCollectorService = req.pluginContext.services.metrics.service;

    const meterProvider = collectorService.getOpenTelemetryMeterProvider();
    const meter = meterProvider.getMeter('my_meter');
    const counter = meter.createCounter('http_request_counter', {
        description: 'HTTP Request Counter',
    });

    counter.add(1);
```

and this:

```typescript
    const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics.service;

    const meterProvider = collectorService.getOpenTelemetryMeterProvider();
    const meter = meterProvider.getMeter('my_meter');
    const observableGauge = meter.createObservableGauge('http_request_counter', {
        description: 'HTTP Request Counter',
    });
    
    meter.addBatchObservableCallback((observableResult) => {
        // ... somehow get the value to measure
        observableResult.observe(observableGauge, theValue);
    }, [observableGauge]);
```

## Services

### MashroomMonitoringMetricsCollectorService

The exposed service is accessible through _pluginContext.services.metrics.service_

**Interface:**

```ts
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
```

<span class="panel-warning">
**NOTE**: Don't keep a global reference to the returned metric objects.
</span>
