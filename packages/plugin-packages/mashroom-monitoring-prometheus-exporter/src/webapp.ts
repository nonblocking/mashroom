
import express from 'express';
import registry from './registry';
import PromClientMashroomMetricsAdapter from './PromClientMashroomMetricsAdapter';

import type {Request, Response} from 'express';
import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

const existingAdapters: {
   [metricName: string]: PromClientMashroomMetricsAdapter;
} = {};

export default (loggerFactory: MashroomLoggerFactory) => {
    const logger = loggerFactory('mashroom.monitoring.prometheus');

    const app = express();

    app.get('/', async (req: Request, res: Response) => {
        const collectorService: MashroomMonitoringMetricsCollectorService = req.pluginContext.services.metrics.service;
        const metrics = collectorService.getMetrics();
        Object.keys(metrics).forEach((metricName) => {
            try {
                const metricsData = metrics[metricName];
                let adapter = existingAdapters[metricName];
                if (!adapter) {
                    adapter = new PromClientMashroomMetricsAdapter(metricName);
                    existingAdapters[metricName] = adapter;
                    registry.registerMetric(adapter as any);
                }
                adapter.setMetrics(metricsData);
            } catch (e) {
                logger.error(`Couldn't add metric ${metricName} to Prometheus!`, e);
            }
        });

        res.set('Content-Type', registry.contentType);
        res.end(await registry.metrics());
    });


    return app;
};
