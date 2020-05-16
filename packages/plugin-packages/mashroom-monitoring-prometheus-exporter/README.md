
# Mashroom Monitoring Prometheus Exporter

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin exports metrics for the [Prometheus](https://prometheus.io) monitoring system.

 * The standard metrics like CPU and memory usage described [here](https://prometheus.io/docs/instrumenting/writing_clientlibs/#standard-and-runtime-collectors)
 * Additional V8 GC metrics (if the module _prometheus-gc-stats_ is present)
 * Loaded plugins with status
 * HTTP request durations and response codes
 * Mashroom plugin metrics like session count, http proxy stats, memory cache stats, MongoDB/Redis connection stats, ...

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-monitoring-prometheus-exporter** as *dependency*.

You can change the default configuration in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Monitoring Prometheus Exporter Webapp": {
            "path": "/myMetricsPath",
            "enableGcStats": true
        }
    }
}
```

 * _path_: The path where the metrics will be exported (default: /metrics)
 * _enableGcStats_: Enable additional GC stats like _runs total_ and _pause seconds total_ (default: true)
