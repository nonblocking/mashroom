
import responseTime from 'response-time';

import type {Request, Response} from 'express';
import type {ExpressRequest, ExpressMiddleware} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringRequestMetricsMiddleware as MashroomMonitoringRequestMetricsMiddlewareType} from '../../type-definitions/internal';
import type {MashroomMonitoringMetricsCollectorService} from '../../type-definitions';

export default class MashroomMonitoringRequestMetricsMiddleware implements MashroomMonitoringRequestMetricsMiddlewareType {

    constructor(private ownPath: string) {
    }

    middleware(): ExpressMiddleware {
        return responseTime((req: Request, res: Response, time: number) => {
            const requestWithContext = req as ExpressRequest;
            const collectorService: MashroomMonitoringMetricsCollectorService = requestWithContext.pluginContext.services.metrics.service;

            const { originalUrl, method } = req;
            if (originalUrl !== this.ownPath) {
                const { statusCode } = res;
                const timeSec = time / 1000;
                const path = this.getCleanPath(originalUrl);

                collectorService.counter('mashroom_http_requests_total', 'Total HTTP requests')
                    .inc(1, { path, method, status: statusCode });
                collectorService.histogram('mashroom_http_request_duration_seconds', 'Request duration in seconds')
                    .observe(timeSec, { path, method, status: statusCode });

            }
        });
    }

    private getCleanPath(originalUrl: string): string {
        // Remove query
        let cleanPath = originalUrl.split('?')[0];
        // Summarize Portal API calls
        if (cleanPath.indexOf('___/api/') !== -1) {
            const parts = cleanPath.split('___/api/');
            cleanPath = `${parts[0]}___/api/${parts[1].split('/')[0]}`;
        }
        return cleanPath;
    }
}
