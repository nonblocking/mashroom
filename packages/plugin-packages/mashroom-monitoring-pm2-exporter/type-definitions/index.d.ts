
import type {MetricConfig} from '@pm2/io/build/main/features/metrics';

export interface PM2MetricExporter {
    start(): void;
    stop(): void;
}

export type Config = {
    pmxMetrics: MetricConfig;
    mashroomMetrics: Array<string>;
}
