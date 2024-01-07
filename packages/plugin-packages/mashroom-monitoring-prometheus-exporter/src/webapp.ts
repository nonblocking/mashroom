
import express from 'express';
import { PrometheusSerializer } from '@opentelemetry/exporter-prometheus';

import type {Request, Response} from 'express';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const serializer = new PrometheusSerializer();

export default () => {
    const app = express();

    app.get('/', async (req: Request, res: Response) => {
        const logger = req.pluginContext.loggerFactory('mashroom.monitoring.prometheus.exporter');
        const collectorService: MashroomMonitoringMetricsCollectorService = req.pluginContext.services.metrics!.service;

        try {
            const resourceMetrics = await collectorService.getOpenTelemetryResourceMetrics();

            res.setHeader('content-type', 'text/plain');
            res.end(serializer.serialize(resourceMetrics));
        } catch (e) {
            logger.error('Prometheus metric export failed!', e);
            res.sendStatus(500);
        }
    });

    return app;
};
