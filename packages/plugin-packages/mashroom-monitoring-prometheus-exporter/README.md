
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
            "path": "/myMetricsPath",
            "enableGcStats": true
        }
    }
}
```

 * _path_: The path where the metrics will be exported (Default: /metrics)
 * _enableGcStats_: Enable additional GC stats like _runs total_ and _pause seconds total_ (Default: true)

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

GC pauses rate:

    sum(rate(nodejs_gc_pause_seconds_total{service="Mashroom"}[5m]))

GC pauses 95% quantile

    histogram_quantile(0.95, sum(rate(nodejs_gc_duration_seconds_bucket[5m])) by (le))

User sessions:

    mashroom_sessions_total{service="Mashroom"}

Active HTTP proxy connections (e.g. Portal App REST calls):

    mashroom_http_proxy_active_connections_total{service="Mashroom"}

Idle HTTP proxy connections:

    mashroom_http_proxy_idle_connections_total{service="Mashroom"}

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

### Node.js Cluster Hints

If you run a Node.js cluster you have to launch a separate server in the master process and gather the
metrics like this:

```typescript
import {AggregatorRegistry} from 'prom-client';
const aggregatorRegistry = new AggregatorRegistry();
metricsServer.get('/metrics', async (req, res) => {
    const metrics = await aggregatorRegistry.clusterMetrics();
    res.set('Content-Type', aggregatorRegistry.contentType);
    res.send(metrics);
});
```

If you use **PM2** this won't work because it occupies the master process. There you need to launch a separate *app*
which communicates with the other workers to gather the metrics. Like this:

Create a script metrics.js:

```javascript
const pm2 = require('pm2');
const promClient = require('prom-client');
const Express = require('express');

const metricsServer = Express();

const dummyRegistry = new promClient.Registry();
const metrics = {};
const metricsServerPort = 15050;

metricsServer.get('/metrics/:id', async (req, res) => {
    const id = req.params.id;
    const slice = metrics[id];
    if (!slice) {
        console.error(`No metrics found for pid ${id}. Known nodes:`, Object.keys(metrics));
        res.sendStatus(404);
        return;
    }
    const response = promClient.AggregatorRegistry.aggregate([slice]);
    res.set('Content-Type', dummyRegistry.contentType);
    res.send(await response.metrics());
});
metricsServer.get('/metrics', async (req, res) => {
    const response = promClient.AggregatorRegistry.aggregate(
        Object.values(metrics).map((o) => o),
    );
    res.set('Content-Type', dummyRegistry.contentType);
    res.send(await response.metrics());
});

metricsServer.listen(metricsServerPort, '0.0.0.0', () => {
    console.debug(`Prometheus cluster metrics are available on http://localhost:${metricsServerPort}/metrics`);
});

setInterval(() => {
    pm2.connect(() => {
        pm2.describe('mashroom', (err, processInfo) => {
            processInfo.forEach((processData) => {
                console.debug(`Asking process ${processData.pm_id} for metrics`);
                pm2.sendDataToProcessId(
                    processData.pm_id,
                    {
                        data: null,
                        topic: 'getMetrics',
                        from: process.env.pm_id,
                    },
                    (err, res) => {},
                );
            });
        });
    });
}, 10000);

process.on('message', (msg) => {
    if (msg.from !== process.env.pm_id && msg.topic === 'returnMetrics') {
        metrics[msg.from] = msg.data;
    }
});
```

And a pm2 config like this:

```json
{
    "apps": [
        {
            "name": "mashroom",
            "instances": 4,
            "max_restarts": 3,
            "exec_mode": "cluster",
            "script": "starter.js",
            "env": {
                "NODE_ENV": "production"
            }
        },
        {
            "name": "metrics_collector",
            "instances": 1,
            "exec_mode": "fork",
            "script": "metrics.js",
            "env": {
                "METRICS_COLLECTOR": true
            }
        }
    ]
}
```

Now the cluster metrics will be available under http:/localhost:15050/metrics.

<span class="panel-info">
**NOTE**: In a real world application it might not be ideal to rely on *prom-client* aggregation.
Instead you should expose the metrics for each worker node separately and do the aggregation in your monitoring tool.
In this example metrics for a single node will be available at http:/localhost:15050/metrics/&lt;pm2_pid&gt;.
</span>

In case you want to get the metrics separately, the Prometheus scrape config could look like this:
```yaml
    - job_name: 'mashroom'
      static_configs:
        - targets:
          - localhost:15050/metrics/0
          - localhost:15050/metrics/2
          - localhost:15050/metrics/3
          - localhost:15050/metrics/4
          labels:
            service: 'Mashroom'
      relabel_configs:
        - source_labels: [__address__]
          regex:  '[^/]+(/.*)'
          target_label: __metrics_path__
        - source_labels: [__address__]
          regex:  '[^/]+/[^/]+/(.*)'
          target_label: node
        - source_labels: [__address__]
          regex:  '([^/]+)/.*'
          target_label: __address__
```

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
