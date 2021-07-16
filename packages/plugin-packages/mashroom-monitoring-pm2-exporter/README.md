
# Mashroom Monitoring PM2 Exporter

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin exports metrics to the [PM2](https://pm2.keymetrics.io) via [pm2/io](https://github.com/keymetrics/pm2-io-apm#readme).
Useful if you use the PM2 process manager to run *Mashroom Server*.

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
 * _mashroomMetrics_: A list of Mashroom plugin metrics that should be exposed. Please note: Currently only *counter* and *gauge* metrics can be exported!
   For a full list install the *mashroom-monitoring-prometheus-exporter* and check the output of /metrics

After starting the server with pm2 you can see the metrics in the "Custom metrics" pane when you start:

    pm2 monit

Or you can get it as JSON (*axm_monitor* property) if you execute

    pm2 prettylist
