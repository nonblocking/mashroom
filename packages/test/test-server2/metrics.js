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
        console.error(`No metrics found for ID ${id}. Known node IDs:`, Object.keys(metrics));
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
    console.debug(`Prometheus cluster metrics are available at http://localhost:${metricsServerPort}/metrics`);
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
