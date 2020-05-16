
import {TDigest} from 'tdigest';
import createLabelHash from './create_label_hash';

import type {MetricLabels, Summary} from '../../type-definitions';
import type {InternalSummaryMetricData} from '../../type-definitions/internal';

export default (metricData: InternalSummaryMetricData): Summary => {
    const getData = (labels: MetricLabels) => {
        const key = createLabelHash(labels);
        if (!metricData.data[key]) {
            metricData.data[key] = {
                count: 0,
                sum: 0,
                tDigest: new TDigest(),
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
                data.tDigest.push(value);
            }
        }
    }
}
