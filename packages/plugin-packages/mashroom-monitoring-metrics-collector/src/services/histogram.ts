
import createLabelHash from './create_label_hash';

import type {Histogram, MetricLabels} from '../../type-definitions';
import type {InternalHistogramMetricData} from '../../type-definitions/internal';

export default (metricData: InternalHistogramMetricData): Histogram => {
    const getData = (labels: MetricLabels) => {
        const key = createLabelHash(labels);
        if (!metricData.data[key]) {
            metricData.data[key] = {
                count: 0,
                sum: 0,
                buckets: metricData.buckets.map((le) => ({
                    le,
                    value: 0,
                })),
                labels,
            };
        }
        return metricData.data[key];
    }

    return {
        observe(value: number, labels: MetricLabels = {}): void {
            if (typeof (value) === 'number') {
                const data = getData(labels);
                data.count++;
                data.sum += value;
                data.buckets.forEach((bucket) => {
                    if (value <= bucket.le) {
                        bucket.value++;
                    }
                });
            }
        }
    }
}
