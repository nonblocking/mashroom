
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {Request, Response} from 'express';
import type {MashroomMonitoringMetricsCollectorService} from '../../type-definitions';

const getCleanRoute = (originalUrl: string, logger: MashroomLogger): string => {
    // Remove query
    let route = originalUrl.split('?')[0];
    try {
        // Cut some routes to avoid too many labels (see Issue #105)

        // Aggregate the routes for API resources
        if (route.indexOf('___/api/') !== -1) {
            const parts = route.split('___/api/');
            const appPathParts = parts[1].split('/');
            route = `${parts[0]}___/api/${appPathParts[0]}`;
        }
        // Aggregate the routes for Proxy IDs
        if (route.indexOf('___/proxy/') !== -1) {
            const parts = route.split('___/proxy/');
            const proxyPathParts = parts[1].split('/');
            route = `${parts[0]}___/proxy/${proxyPathParts.slice(0, 2).join('/')}`;
        }
        // Aggregate the resource routes for Themes
        if (route.indexOf('___/theme/') !== -1) {
            const parts = route.split('___/theme/');
            const themePathParts = parts[1].split('/');
            route = `${parts[0]}___/theme/${themePathParts[0]}`;
        }
        // Aggregate the resource routes for Apps
        if (route.indexOf('___/apps/') !== -1) {
            const parts = route.split('___/apps/');
            const appPathParts = parts[1].split('/');
            route = `${parts[0]}___/apps/${appPathParts[0]}`;
        }
        // Aggregate the resource routes for Page Enhancements
        if (route.indexOf('___/page-enhancements/') !== -1) {
            const parts = route.split('___/page-enhancements/');
            const pageEnhancementPathParts = parts[1].split('/');
            route = `${parts[0]}___/page-enhancements/${pageEnhancementPathParts[0]}`;
        }
    } catch (e) {
        logger.warn('Processing route failed!', e);
    }
    return route;
};

export const addRequestMetric = (req: Request, res: Response, timeSec: number) => {
    const logger = req.pluginContext.loggerFactory('mashroom.monitoring.collector');
    const collectorService: MashroomMonitoringMetricsCollectorService = req.pluginContext.services.metrics.service;
    const { originalUrl, method } = req;
    const { statusCode } = res;

    const route = getCleanRoute(originalUrl, logger);

    collectorService.counter('mashroom_http_requests_total', 'HTTP Requests Total')
        .inc(1, { route, method, status: statusCode });
    collectorService.histogram('mashroom_http_request_duration_seconds', 'HTTP Requests Duration in Seconds')
        .observe(timeSec, { route, method, status: statusCode });
};

