
# Test Server 2

A test server which runs in cluster mode. Doesn't require any external services.

## Requirements

 * [PM2](https://pm2.keymetrics.io/)

## Start

    npm run start-cluster

Open http://localhost:5050 for the Portal and http://localhost:5050/mashroom for the Admin UI

Predefined users: john/john, admin/admin

Also starts a second server that exposes Prometheus metrics on port 15050:

 * Metrics of a single node http://localhost:15050/metrics/<id> (ID can e.g. be 2, 3, 4)

## Stop

    npm run stop-cluster

