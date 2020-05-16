
# Mashroom Monitoring Metrics Collector

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin provides a service to add metrics to the monitoring system that can be used by plugins.
It also adds a middleware that collects request metrics like duration and HTTP status.

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
            },
            "defaultSummaryQuantiles": [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999],
            "customSummaryQuantileConfig": {
            }
        }
    }
}
```

 * _disableMetrics_: A list of metrics that should be disabled
 * _defaultHistogramBuckets_: Default buckets for histogram metrics
 * _customHistogramBucketConfig_: Override the bucket configuration for histogram metrics
 * _defaultSummaryQuantiles_: Default quantiles for summary metrics
 * _customSummaryQuantileConfig_: Override the quantiles configuration for summary metrics

