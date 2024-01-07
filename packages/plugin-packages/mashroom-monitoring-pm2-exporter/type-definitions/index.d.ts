
import type {MetricConfig} from '@pm2/io/build/main/features/metrics';

export type Config = {
    pmxMetrics: MetricConfig;
    mashroomMetrics: Array<string>;
}
