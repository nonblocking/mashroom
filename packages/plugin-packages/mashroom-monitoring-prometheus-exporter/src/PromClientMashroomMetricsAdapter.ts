
import type {
    CounterMetricData,
    GaugeMetricData,
    HistogramMetricData,
    MetricsData,
    SummaryMetricData,
} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

export default class PromClientMashroomMetricsAdapter {

    _promClientData: any;

    constructor(private _metricName: string) {
    }

    setMetrics(metrics: MetricsData): void {
        const {name, help, type} = metrics;
        this._promClientData = {
            aggregator: 'sum',
            name,
            help,
            type,
        };

        switch (type) {
            case 'counter':
                const counterMetrics = metrics as CounterMetricData;
                this._promClientData.values = counterMetrics.data.map(({labels, value}) => ({labels, value}));
            case 'gauge':
                const gaugeMetrics = metrics as GaugeMetricData;
                this._promClientData.values = gaugeMetrics.data.map(({labels, value}) => ({labels, value}));
                break;
            case 'histogram':
                const histogramData = metrics as HistogramMetricData;
                this._promClientData.values = this._calcHistogramValues(histogramData);
                break;
            case 'summary':
                const summaryData = metrics as SummaryMetricData;
                this._promClientData.values = this.calcSummaryValues(summaryData);
                break;
            default:
                break;
        }
    }

    /**
     * This is called by prom-client
     */
    get(): any {
        return this._promClientData;
    }

    get name(): string {
        return this._metricName;
    }

    private _calcHistogramValues(metrics: HistogramMetricData): Array<any> {
        const values: Array<any> = [];

        metrics.data.forEach((data) => {
            data.buckets.forEach((bucket) => {
                values.push({
                    metricName: `${metrics.name}_bucket`,
                    labels: {...data.labels, le: bucket.le},
                    value: bucket.value,
                });
            });
            values.push({
                metricName: `${metrics.name}_bucket`,
                labels: {...data.labels, le: '+Inf'},
                value: data.count,
            });
            values.push({
                metricName: `${metrics.name}_sum`,
                labels: data.labels,
                value: data.sum,
            });
            values.push({
                metricName: `${metrics.name}_count`,
                labels: data.labels,
                value: data.count,
            });
        });

        return values;
    }

    private calcSummaryValues(metrics: SummaryMetricData): Array<any> {
        const values: Array<any> = [];

        metrics.data.forEach((data) => {
            data.buckets.forEach((bucket) => {
                values.push({
                    labels: {...data.labels, quantile: bucket.quantile},
                    value: bucket.value,
                });
            });
            values.push({
                metricName: `${metrics.name}_sum`,
                labels: data.labels,
                value: data.sum,
            });
            values.push({
                metricName: `${metrics.name}_count`,
                labels: data.labels,
                value: data.count,
            });
        });

        return values;
    }

}
