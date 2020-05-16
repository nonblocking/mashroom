
import {Counter, Gauge, Histogram, Summary, Registry} from 'prom-client';
import PromClientMashroomMetricsAdapter from '../src/PromClientMashroomMetricsAdapter';

import type {
    CounterMetricData,
    GaugeMetricData,
    HistogramMetricData,
    SummaryMetricData
} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';

describe('PromClientMashroomMetricsAdapter', () => {

    it('transforms counter metrics correctly', async () => {
        const promClientCounter = new Counter({
            name: 'metric_name',
            help: 'metric_help',
            labelNames: ['foo', 'bar']
        });
        promClientCounter.inc(10);
        promClientCounter.inc({ foo: 2 }, 22);
        promClientCounter.inc({ foo: 2, bar: 'Test' }, 33);

        const mashroomCounterData: CounterMetricData = {
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
                    value: 33,
                    labels: { foo: 2, bar: 'Test' },
                },
            ]
        }

        const adapter = new PromClientMashroomMetricsAdapter();
        adapter.setMetrics(mashroomCounterData);

        // @ts-ignore
        expect(promClientCounter.get()).toEqual(adapter.get());
    });

    it('transforms gauge metrics correctly', async () => {
        const promClientGauge = new Gauge({
            name: 'metric2_name',
            help: 'metric2_help',
            labelNames: ['foo', 'bar']
        });
        promClientGauge.set(10);
        promClientGauge.set({ foo: 2 }, 22);
        promClientGauge.set({ foo: 2, bar: 'Test' }, 33);

        const mashroomGaugeData: GaugeMetricData = {
            name: 'metric2_name',
            help: 'metric2_help',
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
        }

        const adapter = new PromClientMashroomMetricsAdapter();
        adapter.setMetrics(mashroomGaugeData);

        // @ts-ignore
        expect(promClientGauge.get()).toEqual(adapter.get());
    });

    it('transforms histogram metrics correctly', async () => {
        const promClientHistogram = new Histogram({
            name: 'metric3_name',
            help: 'metric3_help',
            labelNames: ['foo', 'bar'],
            buckets: [1, 10, 100, 1000],
        });
        promClientHistogram.observe(5);
        promClientHistogram.observe(50);
        promClientHistogram.observe({ foo: 2 }, 222);
        promClientHistogram.observe({ foo: 2, bar: 'Test' }, 3333);

        const mashroomHistogramData: HistogramMetricData = {
            name: 'metric3_name',
            help: 'metric3_help',
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
        }

        const adapter = new PromClientMashroomMetricsAdapter();
        adapter.setMetrics(mashroomHistogramData);

        // @ts-ignore
        expect(promClientHistogram.get()).toEqual(adapter.get());
    });

    it('transforms summary metrics correctly', async () => {
        const promClientSummary = new Summary({
            name: 'metric4_name',
            help: 'metric4_help',
            labelNames: ['foo', 'bar'],
            percentiles: [0.001, 0.01, 0.1, 0.5],
        });
        promClientSummary.observe(5);
        promClientSummary.observe(50);
        promClientSummary.observe({ foo: 2 }, 222);
        promClientSummary.observe({ foo: 2, bar: 'Test' }, 3333);

        const mashroomSummaryData: SummaryMetricData = {
            name: 'metric4_name',
            help: 'metric4_help',
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
        }

        const adapter = new PromClientMashroomMetricsAdapter();
        adapter.setMetrics(mashroomSummaryData);

        // @ts-ignore
        expect(promClientSummary.get()).toEqual(adapter.get());
    });

    it('can be registered', async () => {
        const mashroomCounterData: CounterMetricData = {
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
                    value: 33,
                    labels: { foo: 2, bar: 'Test' },
                },
            ]
        }

        const adapter = new PromClientMashroomMetricsAdapter();
        adapter.setMetrics(mashroomCounterData);

        const registry = new Registry();
        registry.registerMetric(adapter as any);

        expect(registry.metrics()).toContain('metric_name 10');
    });

});
