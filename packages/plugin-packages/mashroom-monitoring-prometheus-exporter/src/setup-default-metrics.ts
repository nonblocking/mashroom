
import {collectDefaultMetrics} from 'prom-client';
import registry from './registry';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';

export default (loggerFactory: MashroomLoggerFactory) => {

    collectDefaultMetrics({
        register: registry,

    });

};
