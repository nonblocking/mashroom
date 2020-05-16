
import express from 'express';
import registry from './registry';

import type {ExpressApplication, ExpressRequest, ExpressResponse, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';

export default (loggerFactory: MashroomLoggerFactory) => {

    const app: ExpressApplication = express();

    app.get('/', (req: ExpressRequest, res: ExpressResponse) => {

        // TODO: add metrics from MashroomMonitoringStatsCollectorService

        res.set('Content-Type', registry.contentType);
        res.end(registry.metrics());
    });


    return app;
};
