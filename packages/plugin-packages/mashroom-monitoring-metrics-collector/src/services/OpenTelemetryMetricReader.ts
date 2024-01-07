import {MetricReader} from '@opentelemetry/sdk-metrics';

export class OpenTelemetryMetricReader extends MetricReader {

    protected async onForceFlush(): Promise<void> {
        // Nothing to do
    }

    protected async onShutdown(): Promise<void> {
        // Nothing to do
    }

}
