
# Mashroom Monitoring PM2 Exporter

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin exports metrics to the [PM2](https://pm2.keymetrics.io) via [pm2/io](https://github.com/keymetrics/pm2-io-apm#readme).
Which is useful if you use the PM2 process manager to run *Mashroom Server*.

It activates the pm2/io default metrics like v8, runtime, network, http (configurable).
And it exports *Mashroom* plugin metrics like session count, memory cache stats, MongoDB/Redis connection stats, ...

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-monitoring-pm2-exporter** as *dependency*.

You can change the default configuration in your Mashroom config file like this:

```json
     "plugins": {
         "Mashroom Monitoring PM2 Exporter": {
              "pmxMetrics": {
                  "v8": true,
                  "runtime": true,
                  "network": {
                      "upload": true,
                      "download": true
                  },
                  "http": true,
                  "eventLoop": true
              },
              "mashroomMetrics": [
                  "mashroom_plugins_total",
                  "mashroom_plugins_loaded_total",
                  "mashroom_plugins_error_total",
                  "mashroom_remote_apps_total",
                  "mashroom_remote_apps_error_total",
                  "mashroom_remote_apps_connection_timeout_total",
                  "mashroom_sessions_total",
                  "mashroom_websocket_connections_total",
                  "mashroom_https_proxy_active_connections_total",
                  "mashroom_https_proxy_idle_connections_total",
                  "mashroom_https_proxy_waiting_requests_total",
                  "mashroom_sessions_mongodb_connected",
                  "mashroom_sessions_redis_nodes_connected",
                  "mashroom_storage_mongodb_connected",
                  "mashroom_memory_cache_entries_added_total",
                  "mashroom_memory_cache_hit_ratio",
                  "mashroom_memory_cache_redis_nodes_connected",
                  "mashroom_messaging_amqp_connected",
                  "mashroom_messaging_mqtt_connected"
              ]
         }
    }
}
```

 * _pmxMetrics_: Will be passed as *metrics* to the [pm2/io configuration](https://github.com/keymetrics/pm2-io-apm/tree/master#configuration)
 * _mashroomMetrics_: A list of Mashroom plugin metrics that should be exposed.

<span class="panel-info">
**NOTE**: Currently only *counter* and *gauge* metrics can be exported!
For a full list install the *mashroom-monitoring-prometheus-exporter* and check the output of /metrics
</span>

After starting the server with pm2 you can see the metrics in the "Custom metrics" pane when you start:

    pm2 monit

Or you can get it as JSON (*axm_monitor* property) if you execute

    pm2 prettylist

### Fetching all metrics via inter-process communication

If you want to gather all metrics in OpenTelemetry format you can use inter-process communication. 

Here as an example how to export the metrics for each worker and make it available in Prometheus format:

Create a script metrics.js with a simple webserver:

```javascript
const pm2 = require('pm2');
const { PrometheusSerializer } = require('@opentelemetry/exporter-prometheus');
const Express = require('express');
const metricsServer = Express();

const metrics = {}; // <pid> -> OpenTelemetry ResourceMetrics
const metricsServerPort = 15050;
const prometheusSerializer = new PrometheusSerializer();

metricsServer.get('/metrics/:id', async (req, res) => {
    const id = req.params.id;
    const slice = metrics[id];
    if (!slice) {
        console.error(`No metrics found for ID ${id}. Known node IDs:`, Object.keys(metrics));
        res.sendStatus(404);
        return;
    }
    res.set('Content-Type', 'text/plain');
    res.end(prometheusSerializer.serialize(slice));
});

metricsServer.listen(metricsServerPort, '0.0.0.0', () => {
    console.debug(`Prometheus cluster metrics are available at http://localhost:${metricsServerPort}/metrics`);
});

setInterval(() => {
    pm2.connect(() => {
        pm2.describe('mashroom', (describeError, processInfo) => {
            if (!describeError) {
                Promise.all(processInfo.map((processData) => {
                    console.debug(`Asking process ${processData.pm_id} for metrics`);
                    return new Promise((resolve) => {
                        pm2.sendDataToProcessId(
                            processData.pm_id,
                            {
                                data: null,
                                topic: 'getMetrics',
                                from: process.env.pm_id,
                            },
                            (err, res) => {
                                if (err) {
                                    console.error('Error sending data via PM2 intercom', err);
                                }
                                resolve();
                            },
                        );
                    });
                })).finally(() => {
                    pm2.disconnect();
                });
            } else {
                pm2.disconnect();
            }
        });
    });
}, 10000);

process.on('message', (msg) => {
    if (msg.from !== process.env.pm_id && msg.topic === 'returnMetrics') {
        console.debug(`Received metrics from process ${msg.from}`);
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
            "script": "metrics.js"
        }
    ]
}
```

Now the worker metrics will be available under http:/localhost:15050/metrics/<id>.

A Prometheus scrape config could look like this:

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

