
import MashroomMonitoringMetricsCollectorService from '../../src/services/MashroomMonitoringMetricsCollectorService';

import type {MashroomMonitoringMetricsCollectorConfig} from '../../type-definitions/internal';

describe('MashroomMonitoringMetricsCollectorService', () => {

    const loggerFactory: any = () => console;
    const config: MashroomMonitoringMetricsCollectorConfig = {
        disableMetrics: [
            'ignore_me_metric',
        ],
        defaultHistogramBuckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        customHistogramBucketConfig: {
            histogram1: [1, 2],
        },
    };

    it('exports counter data correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const counter = service.counter( 'metric_name', 'metric_help');
        counter.inc(10);
        counter.inc(22, { foo: 2 });
        counter.inc(22, { foo: 2 });
        counter.inc(2, { foo: 3 });
        counter.inc(33, { foo: 2, bar: 'Test' });

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();
        expect(resourceMetrics.scopeMetrics[0].metrics[0]).toMatchObject({
            descriptor: {
                name: 'metric_name',
                description: 'metric_help',
                type: 'COUNTER',
            },
            dataPoints: [
                {
                    value: 10,
                    attributes: {},
                },
                {
                    value: 44,
                    attributes: { foo: 2 },
                },
                {
                    value: 2,
                    attributes: { foo: 3 },
                },
                {
                    value: 33,
                    attributes: { foo: 2, bar: 'Test' },
                },
            ]
        });
    });

    it('exports histogram data correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const histogram = service.histogram( 'metric_name', 'metric_help', [1, 10, 100, 1000]);
        histogram.record(5);
        histogram.record(50);
        histogram.record(222,{ foo: 2 } );
        histogram.record(3333, { foo: 2, bar: 'Test' });

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();
        expect(resourceMetrics.scopeMetrics[0].metrics[0]).toMatchObject({
            descriptor: {
                name: 'metric_name',
                description: 'metric_help',
                type: 'HISTOGRAM',
                advice: {
                    explicitBucketBoundaries: [
                        1,
                        10,
                        100,
                        1000
                    ]
                }
            },
            dataPoints: [
                {

                    attributes: {},
                    value: {
                        min: 5,
                        max: 50,
                        sum: 55,
                        buckets: {
                            boundaries: [
                                1,
                                10,
                                100,
                                1000
                            ],
                            counts: [
                                0,
                                1,
                                1,
                                0,
                                0
                            ]
                        },
                        count: 2
                    },
                },
                {

                    attributes: { foo: 2 },
                    value: {
                        min: 222,
                        max: 222,
                        sum: 222,
                        buckets: {
                            boundaries: [
                                1,
                                10,
                                100,
                                1000
                            ],
                            counts: [
                                0,
                                0,
                                0,
                                1,
                                0
                            ]
                        },
                        count: 1
                    },
                },
                {

                    attributes: { foo: 2, bar: 'Test' },
                    value: {
                        min: 3333,
                        max: 3333,
                        sum: 3333,
                        buckets: {
                            boundaries: [
                                1,
                                10,
                                100,
                                1000
                            ],
                            counts: [
                                0,
                                0,
                                0,
                                0,
                                1
                            ]
                        },
                        count: 1
                    }
                },
            ]
        });
    });

    it('exports observable counter data correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        await service.addObservableCallback((asyncCollectorService) => {
            const counter = asyncCollectorService.counter( 'metric_name', 'metric_help');
            counter.set(10);
            counter.set(22, { foo: 2 });
            counter.set(2, { foo: 3 });
            counter.set(33, { foo: 2, bar: 'Test' });
        });

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();
        expect(resourceMetrics.scopeMetrics[0].metrics[0]).toMatchObject({
            descriptor: {
                name: 'metric_name',
                description: 'metric_help',
                type: 'OBSERVABLE_COUNTER',
            },
            dataPoints: [
                {
                    value: 10,
                    attributes: {},
                },
                {
                    value: 22,
                    attributes: { foo: 2 },
                },
                {
                    value: 2,
                    attributes: { foo: 3 },
                },
                {
                    value: 33,
                    attributes: { foo: 2, bar: 'Test' },
                },
            ]
        });
    });

    it('exports observable gauge data correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        await service.addObservableCallback((asyncCollectorService) => {
            const gauge = asyncCollectorService.gauge( 'metric_name', 'metric_help');
            gauge.set(10);
            gauge.set(-22, { foo: 2 });
            gauge.set(33, { foo: 2, bar: 'Test' });
        });

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();
        expect(resourceMetrics.scopeMetrics[0].metrics[0]).toMatchObject({
            descriptor: {
                name: 'metric_name',
                description: 'metric_help',
                type: 'OBSERVABLE_GAUGE',
            },
            dataPoints: [
                {
                    value: 10,
                    attributes: {},
                },
                {
                    value: -22,
                    attributes: { foo: 2 },
                },
                {
                    value: 33,
                    attributes: { foo: 2, bar: 'Test' },
                },
            ]
        });
    });

    it('handles async callbacks correctly', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        await service.addObservableCallback(async (asyncCollectorService) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const counter = asyncCollectorService.counter( 'metric_name', 'metric_help');
            counter.set(10);
            counter.set(22, { foo: 2 });
        });

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();
        expect(resourceMetrics.scopeMetrics[0].metrics[0]).toMatchObject({
            descriptor: {
                name: 'metric_name',
                description: 'metric_help',
                type: 'OBSERVABLE_COUNTER',
            },
            dataPoints: [
                {
                    value: 10,
                    attributes: {},
                },
                {
                    value: 22,
                    attributes: { foo: 2 },
                },
            ]
        });
    });

    it('ignores metrics if configured', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const counter = service.counter( 'ignore_me_metric', 'test');
        counter.inc(10);

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();
        expect(resourceMetrics.scopeMetrics.length).toBe(0);
    });

    it('overrides histogram buckets if configured', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const histogram = service.histogram( 'histogram1', 'test', [1, 10, 100, 1000]);
        histogram.record(5);

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();
        expect(resourceMetrics.scopeMetrics[0].metrics[0]).toMatchObject({
            descriptor: {
                name: 'histogram1',
                description: 'test',
                type: 'HISTOGRAM',
                advice: {
                    explicitBucketBoundaries: [1, 2],
                }
            },
        });
    });

    it('exports counter when plain OpenTelemetry API is being used', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        const meterProvider = service.getOpenTelemetryMeterProvider();
        const meter = meterProvider.getMeter('my_meter');
        const counter = meter.createCounter('metric_name', {
            description: 'metric_help',
        });

        counter.add(10);
        counter.add(22, { foo: 2 });

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();
        expect(resourceMetrics.scopeMetrics[0].metrics[0]).toMatchObject({
            descriptor: {
                name: 'metric_name',
                description: 'metric_help',
                type: 'COUNTER',
            },
            dataPoints: [
                {
                    value: 10,
                    attributes: {},
                },
                {
                    value: 22,
                    attributes: { foo: 2 },
                }
            ]
        });
    });

    it('handles errors in callbacks', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        await service.addObservableCallback(() => {
            throw new Error('boooom');
        });

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics();

        expect(resourceMetrics).toBeTruthy();
    });

    it('removes all callbacks on reload', async () => {
        const service = new MashroomMonitoringMetricsCollectorService(config, loggerFactory);

        let count = 1;
        await service.addObservableCallback((asyncCollectorService) => {
            const counter = asyncCollectorService.counter( 'metric_name', 'metric_help');
            counter.set(count ++);
        });

        await service.getOpenTelemetryResourceMetrics(); // Counter: 2
        await service.getOpenTelemetryResourceMetrics(); // Counter: 3

        service.shutdown();

        const resourceMetrics = await service.getOpenTelemetryResourceMetrics(); // Counter should not be increased

        expect(resourceMetrics.scopeMetrics[0].metrics[0]).toMatchObject({
            dataPoints: [
                {
                    value: 3,
                    attributes: {},
                }
            ]
        });
    });

});
