
import createLabelHash from './create-label-hash';

import type {Counter, MetricLabels} from '../../type-definitions';
import type {InternalCounterMetricData} from '../../type-definitions/internal';

export default (metricData: InternalCounterMetricData): Counter => {
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
        inc(by = 1, labels: MetricLabels = {}): void {
            if (typeof (by) === 'number') {
                const data = getData(labels);
                data.value = data.value + by;
            }
        },
        set(value: number, labels: MetricLabels = {}): void {
            if (typeof (value) === 'number') {
                const data = getData(labels);
                if (data.value <= value) {
                    data.value = value;
                }
            }
        },
    };
};
