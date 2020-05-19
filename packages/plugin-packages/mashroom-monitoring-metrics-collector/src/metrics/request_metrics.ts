
import type {Request, Response} from 'express';
import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '../../type-definitions';

const getCleanRoute = (originalUrl: string): string => {
    // Remove query
    let route = originalUrl.split('?')[0];
    // Summarize Portal API calls
    if (route.indexOf('___/api/') !== -1) {
        const parts = route.split('___/api/');
        route = `${parts[0]}___/api/${parts[1].split('/')[0]}`;
    }
    return route;
}

export const addRequestMetric = (req: Request, res: Response, timeSec: number) => {
    const requestWithContext = req as ExpressRequest;
    const collectorService: MashroomMonitoringMetricsCollectorService = requestWithContext.pluginContext.services.metrics.service;
    const { originalUrl, method } = req;
    const { statusCode } = res;

    const route = getCleanRoute(originalUrl);

    collectorService.counter('mashroom_http_requests_total', 'HTTP Requests Total')
        .inc(1, { route, method, status: statusCode });
    collectorService.histogram('mashroom_http_request_duration_seconds', 'HTTP Requests Duration in Seconds')
        .observe(timeSec, { route, method, status: statusCode });
}

