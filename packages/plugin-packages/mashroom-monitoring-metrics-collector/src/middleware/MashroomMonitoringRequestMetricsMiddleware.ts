
import responseTime from 'response-time';
import {addRequestMetric} from '../metrics/request_metrics';

import type {Request, Response} from 'express';
import type {ExpressMiddleware} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringRequestMetricsMiddleware as MashroomMonitoringRequestMetricsMiddlewareType} from '../../type-definitions/internal';

export default class MashroomMonitoringRequestMetricsMiddleware implements MashroomMonitoringRequestMetricsMiddlewareType {

    constructor(private ownPath: string) {
    }

    middleware(): ExpressMiddleware {
        return responseTime((req: Request, res: Response, time: number) => {
            const { originalUrl } = req;
            if (originalUrl !== this.ownPath) {
                addRequestMetric(req, res, time / 1000);
            }
        });
    }

}
