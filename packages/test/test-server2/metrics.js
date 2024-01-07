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
