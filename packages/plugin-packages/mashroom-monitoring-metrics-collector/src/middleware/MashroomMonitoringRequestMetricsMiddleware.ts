
import type {ExpressNextFunction, ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringRequestMetricsMiddleware as MashroomMonitoringRequestMetricsMiddlewareType} from '../../type-definitions/internal';
import type {MashroomMonitoringMetricsCollectorService} from '../../type-definitions';

export default class MashroomMonitoringRequestMetricsMiddleware implements MashroomMonitoringRequestMetricsMiddlewareType {

    constructor(private ownPath: string) {
    }


    middleware() {
        return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            const collectorService: MashroomMonitoringMetricsCollectorService = req.pluginContext.services.metrics.service;

            const path = req.path;
            if (path !== this.ownPath) {

                // TODO
                collectorService.counter('dummy_request_counter', 'Test').inc();

            }

            next();
        };
    }

}
