
import {collectDefaultMetrics} from 'prom-client';
import registry from './registry';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {PrometheusGcStats} from '../type-definitions';

export default (enableGcStats: boolean, loggerFactory: MashroomLoggerFactory) => {

    collectDefaultMetrics({
        register: registry,
    });

    if (enableGcStats) {

        let gcStats: PrometheusGcStats | undefined;
        try {
            gcStats = require('prometheus-gc-stats');
        } catch (e) {
            // Ignore
        }

        if (gcStats) {
            const startGcStats = gcStats(registry);
            startGcStats();
        } else {
            const logger = loggerFactory('mashroom.monitoring.prometheus');
            logger.warn('GC metrics disabled because prometheus-gc-stats is not installed');
        }
    }

};
