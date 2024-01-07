
import {getRouteLabel} from './utils';
import type {Request, Response} from 'express';
import type {MashroomMonitoringMetricsCollectorService} from '../../type-definitions';

export const addRequestMetric = (req: Request, res: Response, timeSec: number) => {
    const logger = req.pluginContext.loggerFactory('mashroom.monitoring.collector');
    const collectorService: MashroomMonitoringMetricsCollectorService = req.pluginContext.services.metrics!.service;
    const { originalUrl, method } = req;
    const { statusCode } = res;

    const route = getRouteLabel(originalUrl, logger);

    collectorService.counter('mashroom_http_requests_total', 'HTTP Requests Total')
        .inc(1, { route, method, status: statusCode });
    collectorService.histogram('mashroom_http_request_duration_seconds', 'HTTP Requests Duration in Seconds')
        .record(timeSec, { route, method, status: statusCode });
};

