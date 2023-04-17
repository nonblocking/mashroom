
import createLabelHash from './create_label_hash';

import type {Gauge, MetricLabels} from '../../type-definitions';
import type {InternalGaugeMetricData} from '../../type-definitions/internal';

export default (metricData: InternalGaugeMetricData): Gauge => {
    const getData = (labels: MetricLabels) => {
        const key = createLabelHash(labels);
        if (!metricData.data[key]) {
            metricData.data[key] = {
                value: 0,
                labels,
            };
        }
        return metricData.data[key];
    };

    return {
        reset() {
            metricData.data = {};
        },
        set(value: number, labels: MetricLabels = {}): void {
            if (typeof (value) === 'number') {
                getData(labels).value = value;
            }
        },
    };
};
