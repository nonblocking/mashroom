
# Grafana Test Instance

First of all start the testserver in packages/test/test-server1 to get some metrics.

Then start Grafana and Prometheus with:

    docker-compose up

Open Grafana at http://localhost:3000, login with admin/test and open the _Mashroom_ Dashboard.

The Prometheus target configuration will be available at http://localhost:9090/targets
