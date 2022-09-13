
# Test Server

A test server which runs in cluster mode. Doesn't require any external services.

## Requirements

 * [PM2](https://pm2.keymetrics.io/)

## Start

    npm run start-cluster

Open http://localhost:5050 for the Portal and http://localhost:5050/mashroom for the Admin UI

Predefined users: john/john, admin/admin

Also starts a Prometheus Metrics Server on port 15050 (http://localhost:15050/metrics)

## Stop

    npm run stop-cluster

