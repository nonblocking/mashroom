
import {createHash} from 'crypto';

import type {MetricLabels} from '../../type-definitions';

export default (labels: MetricLabels): string => {
    return createHash('md5').update(JSON.stringify(labels)).digest('hex');
}
