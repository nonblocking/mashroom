

import {loggingUtils} from '@mashroom/mashroom-utils';
import {MeterProvider, MetricReader} from '@opentelemetry/sdk-metrics';
import {exportOpenTelemetryMetrics, getPM2Metrics} from '../src/pm2-metric-exporter';

describe('pm2-metric-exporter', () => {

    it('exports selected metrics to PM2', async () => {
        const config = {
            pmxMetrics: {},
            mashroomMetrics: [
                'mashroom_plugins_total',
                'mashroom_plugins_loaded_total',
                'mashroom_plugins_error_total',
                'mashroom_remote_app_endpoints_total',
                'mashroom_remote_app_endpoints_error_total'
            ]
        };

        const reader = new class MyMetricReader extends MetricReader {
            protected async onForceFlush() {}
            protected async onShutdown() {}
        };
        const meterProvider = new MeterProvider();
        meterProvider.addMetricReader(reader);
        const meter = meterProvider.getMeter('test-meter');

        const fooCounter = meter.createCounter('foo', {
            description: 'Test',
        });
        const pluginsTotalGauge = meter.createObservableGauge('mashroom_plugins_total', {
            description: 'Test',
        });
        const pluginErrorsTotalCounter = meter.createCounter('mashroom_plugins_error_total', {
            description: 'Test',
        });

        fooCounter.add(3);
        pluginsTotalGauge.addCallback((observableResult) => {
           observableResult.observe(10, {
               foo: 'bar',
               x: 1,
           });
        });
        pluginErrorsTotalCounter.add(2);

        const result = await reader.collect();

        exportOpenTelemetryMetrics(config, result.resourceMetrics, loggingUtils.dummyLoggerFactory());
        const metrics = getPM2Metrics();

        expect(Object.keys(metrics)).toEqual([
            'mashroom_plugins_total[foo=bar,x=1]',
            'mashroom_plugins_error_total',
        ]);
    });

});
