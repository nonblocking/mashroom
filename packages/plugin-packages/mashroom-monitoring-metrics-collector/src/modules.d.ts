
declare module 'opentelemetry-node-metrics' {
    import type {MeterProvider} from '@opentelemetry/sdk-metrics';

    type Config = {
        readonly prefix?: string;
        readonly labels?: Record<string, string>;
    };

    export default function(meterProvider: MeterProvider, config?: Config): void;
}
