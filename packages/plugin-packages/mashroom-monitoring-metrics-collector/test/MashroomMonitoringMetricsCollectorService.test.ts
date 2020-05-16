
import MashroomMonitoringMetricsCollectorService from '../src/services/MashroomMonitoringMetricsCollectorService';

import type {MashroomMonitoringMetricsCollectorConfig} from '../type-definitions/internal';

describe('MashroomMonitoringMetricsCollectorService', () => {

    const loggerFactory: any = () => console;
    const config: MashroomMonitoringMetricsCollectorConfig = {
        disableMetrics: [
            'ignore_me_metric',
        ],
        defaultHistogramBuckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        customHistogramBucketConfig: {
            'histogram1': [1, 2],
        },
        defaultSummaryQuantiles: [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999],
        customSummaryQuantileConfig: {
            'summary1': [0.1, 0.2],
        }
    };

    it('stores counter data correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const counter = service.counter( 'metric_name', 'metric_help');
        counter.inc(10);
        counter.inc(22, { foo: 2 });
        counter.set(2, { foo: 3 });
        counter.inc(33, { foo: 2, bar: 'Test' });

        expect(service.getMetrics()['metric_name']).toEqual({
            name: 'metric_name',
            help: 'metric_help',
            type: 'counter',
            data: [
                {
                    value: 10,
                    labels: {},
                },
                {
                    value: 22,
                    labels: { foo: 2 },
                },
                {
                    value: 2,
                    labels: { foo: 3 },
                },
                {
                    value: 33,
                    labels: { foo: 2, bar: 'Test' },
                },
            ]
        });
    });

    it('stores gauge data correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const gauge = service.gauge( 'metric_name', 'metric_help');
        gauge.set(10);
        gauge.set(22, { foo: 2 });
        gauge.set(33, { foo: 2, bar: 'Test' });

        expect(service.getMetrics()['metric_name']).toEqual({
            name: 'metric_name',
            help: 'metric_help',
            type: 'gauge',
            data: [
                {
                    value: 10,
                    labels: {},
                },
                {
                    value: 22,
                    labels: { foo: 2 },
                },
                {
                    value: 33,
                    labels: { foo: 2, bar: 'Test' },
                },
            ]
        });
    });

    it('stores histogram data correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const histogram = service.histogram( 'metric_name', 'metric_help', [1, 10, 100, 1000]);
        histogram.observe(5);
        histogram.observe(50);
        histogram.observe(222,{ foo: 2 } );
        histogram.observe(3333, { foo: 2, bar: 'Test' });


        expect(service.getMetrics()['metric_name']).toEqual({
            name: 'metric_name',
            help: 'metric_help',
            type: 'histogram',
            data: [
                {
                    buckets: [
                        {
                            le: 1,
                            value: 0,
                        },
                        {
                            le: 10,
                            value: 1,
                        },
                        {
                            le: 100,
                            value: 2,
                        },
                        {
                            le: 1000,
                            value: 2,
                        }
                    ],
                    sum: 55,
                    count: 2,
                    labels: {},
                },
                {
                    buckets: [
                        {
                            le: 1,
                            value: 0,
                        },
                        {
                            le: 10,
                            value: 0,
                        },
                        {
                            le: 100,
                            value: 0,
                        },
                        {
                            le: 1000,
                            value: 1,
                        }
                    ],
                    sum: 222,
                    count: 1,
                    labels: { foo: 2 },
                },
                {
                    buckets: [
                        {
                            le: 1,
                            value: 0,
                        },
                        {
                            le: 10,
                            value: 0,
                        },
                        {
                            le: 100,
                            value: 0,
                        },
                        {
                            le: 1000,
                            value: 0,
                        }
                    ],
                    sum: 3333,
                    count: 1,
                    labels: { foo: 2, bar: 'Test' },
                },
            ]
        });
    });

    it('stores summary data correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const summary = service.summary( 'metric_name', 'metric_help', [0.001, 0.01, 0.1, 0.5]);
        summary.observe(5);
        summary.observe(50);
        summary.observe(222,{ foo: 2 } );
        summary.observe(3333, { foo: 2, bar: 'Test' });

        expect(service.getMetrics()['metric_name']).toEqual({
            name: 'metric_name',
            help: 'metric_help',
            type: 'summary',
            data: [
                {
                    buckets: [
                        {
                            quantile: 0.001,
                            value: 5,
                        },
                        {
                            quantile: 0.01,
                            value: 5,
                        },
                        {
                            quantile: 0.1,
                            value: 5,
                        },
                        {
                            quantile: 0.5,
                            value: 27.5,
                        }
                    ],
                    sum: 55,
                    count: 2,
                    labels: {},
                },
                {
                    buckets: [
                        {
                            quantile: 0.001,
                            value: 222,
                        },
                        {
                            quantile: 0.01,
                            value: 222,
                        },
                        {
                            quantile: 0.1,
                            value: 222,
                        },
                        {
                            quantile: 0.5,
                            value: 222,
                        }
                    ],
                    sum: 222,
                    count: 1,
                    labels: { foo: 2 },
                },
                {
                    buckets: [
                        {
                            quantile: 0.001,
                            value: 3333,
                        },
                        {
                            quantile: 0.01,
                            value: 3333,
                        },
                        {
                            quantile: 0.1,
                            value: 3333,
                        },
                        {
                            quantile: 0.5,
                            value: 3333,
                        }
                    ],
                    sum: 3333,
                    count: 1,
                    labels: { foo: 2, bar: 'Test' },
                },
            ]
        });
    });

    it('ignores metrics if configured', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const counter = service.counter( 'ignore_me_metric', 'test');
        counter.inc(10);

        expect(service.getMetrics()).toEqual({});
    });

    it('overrides histogram buckets if configured', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const histogram = service.histogram( 'histogram1', 'test', [1, 10, 100, 1000]);
        histogram.observe(5);

        expect(service.getMetrics()['histogram1'].data[0]).toEqual({
            'buckets': [
                {
                    'le': 1,
                    'value': 0
                },
                {
                    'le': 2,
                    'value': 0
                }
            ],
            'count': 1,
            'labels': {},
            'sum': 5
        });
    });

    it('overrides summary quantiles if configured', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const summary = service.summary( 'summary1', 'test', [0.001, 0.01, 0.1, 0.5]);
        summary.observe(5);

        expect(service.getMetrics()['summary1'].data[0]).toEqual({
            'buckets': [
                {
                    'quantile': 0.1,
                    'value': 5
                },
                {
                    'quantile': 0.2,
                    'value': 5
                }
            ],
            'count': 1,
            'labels': {},
            'sum': 5
        });
    });

});
