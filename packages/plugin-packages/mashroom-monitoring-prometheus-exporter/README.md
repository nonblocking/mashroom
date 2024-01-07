
# Mashroom Monitoring Prometheus Exporter

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin exports the following metrics to the [Prometheus](https://prometheus.io) monitoring system:

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
            "path": "/myMetricsPath"
        }
    }
}
```

 * _path_: The path where the metrics will be exported (Default: /metrics)

### Example Queries

> The examples assume the Prometheus job to scrape the metrics adds the label service:Mashroom

Request rate:

    sum(rate(mashroom_http_requests_total{service="Mashroom"}[5m]))

Requests with HTTP 500 response rate:

    sum(rate(mashroom_http_requests_total{status="500", service="Mashroom"}[5m]))

95% of requests served within seconds:

    histogram_quantile(0.95, sum(rate(mashroom_http_request_duration_seconds_bucket{service="Mashroom"}[5m])) by (le)) * 1000

Heap total in MB:

    nodejs_heap_size_total_bytes{service="Mashroom"} / 1024 / 1024

Heap used in MB:

    nodejs_heap_size_used_bytes{service="Mashroom"} / 1024 / 1024

CPU usage total in %:

    avg(irate(process_cpu_seconds_total{service="Mashroom"}[5m])) * 100

GC pauses 95% quantile

    histogram_quantile(0.95, sum(rate(nodejs_gc_duration_seconds_bucket[5m])) by (le))

User sessions:

    mashroom_sessions_total{service="Mashroom"}

Active HTTP proxy connections (e.g. Portal App REST calls):

    mashroom_http_proxy_http_pool_connections_active_total{service="Mashroom"}
    mashroom_http_proxy_https_pool_connections_active_total{service="Mashroom"}
    mashroom_http_proxy_ws_connections_active_total{service="Mashroom"}

Idle HTTP proxy connections:

    mashroom_http_proxy_http_pool_connections_idle_total{service="Mashroom"}
    mashroom_http_proxy_https_pool_connections_idle_total{service="Mashroom"}

Plugins total:

    mashroom_plugins_total{service="Mashroom"}

Plugins loaded:

    mashroom_plugins_loaded_total{service="Mashroom"}

Plugins in error state:

    mashroom_plugins_error_total{service="Mashroom"}

Remote portal apps total:

    mashroom_remote_apps_total{service="Mashroom"}

Remote portal apps in error state:

    mashroom_remote_apps_error_total{service="Mashroom"}

Remote portal apps with connection timeouts:

    mashroom_remote_apps_connection_timeout_total{service="Mashroom"}

Kubernetes remote portal apps total:

    mashroom_remote_apps_k8s_total{service="Mashroom"}

Kubernetes remote portal apps in error state:

    mashroom_remote_apps_k8s_error_total{service="Mashroom"}

Kubernetes remote portal apps with connection timeouts:

    mashroom_remote_apps_k8s_connection_timeout_total{service="Mashroom"}

Memory cache hit ratio:

    mashroom_memory_cache_hit_ratio{service="Mashroom"}

Redis session store provider connected:

    mashroom_sessions_redis_nodes_connected{service="Mashroom"}

Redis memory cache provider connected:

    mashroom_memory_cache_redis_nodes_connected{service="Mashroom"}

MongoDB storage provider connected:

    mashroom_storage_mongodb_connected{service="Mashroom"}

MQTT messaging system connected:

    mashroom_messaging_mqtt_connected{service="Mashroom"}

### Kubernetes Hints

On Kubernetes the metrics are scraped separately for each container.
So, you have to do the aggregation in the query.

For example, the overall request rate would still be:

    sum(rate(mashroom_http_requests_total{namespace="my-namespace"}[5m]))

But the request rate per pod:

    sum by (kubernetes_pod_name) (rate(mashroom_http_requests_total{namespace="my-namespace"}[5m]))

Or the Session count per pod:

    mashroom_sessions_total{namespace="my-namespace"} by (kubernetes_pod_name)

In the last two examples you typically would use {{kubernetes_pod_name}} in the legend.

### Demo Grafana Dashboard

You can find a demo Grafana Dashboard here: [https://github.com/nonblocking/mashroom/tree/master/packages/plugin-packages/mashroom-monitoring-prometheus-exporter/test/grafana-test/grafana/provisioning/dashboards/Mashroom%20Dashboard.json](https://github.com/nonblocking/mashroom/tree/master/packages/plugin-packages/mashroom-monitoring-prometheus-exporter/test/grafana-test/grafana/provisioning/dashboards/Mashroom%20Dashboard.json)
