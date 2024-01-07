
import {MeterProvider, MetricReader} from '@opentelemetry/sdk-metrics';
import serializableResourceMetrics from '../src/serializable-resource-metrics';

describe('serializable-resource-metrics', () => {

    it('exports selected metrics to PM2', async () => {
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

        fooCounter.add(3);

        const result = await reader.collect();

        const resourceMetrics = JSON.parse(JSON.stringify(serializableResourceMetrics(result.resourceMetrics)));

        expect(resourceMetrics.resource.attributes).toBeTruthy();
    });

});
