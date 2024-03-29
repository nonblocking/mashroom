
import responseTime from 'response-time';
import {addRequestMetric} from '../metrics/request-metrics';

import type {Request, Response, RequestHandler} from 'express';
import type {MashroomMonitoringRequestMetricsMiddleware as MashroomMonitoringRequestMetricsMiddlewareType} from '../../type-definitions/internal';

export default class MashroomMonitoringRequestMetricsMiddleware implements MashroomMonitoringRequestMetricsMiddlewareType {

    constructor(private _ownPath: string) {
    }

    middleware(): RequestHandler {
        return responseTime((req: Request, res: Response, time: number) => {
            const { originalUrl } = req;
            if (originalUrl !== this._ownPath) {
                addRequestMetric(req, res, time / 1000);
            }
        });
    }

}
