
import type {Registry} from 'prom-client';

export type PrometheusGcStats = (registry: Registry, config?: any) => () => void;

// See https://github.com/siimon/prom-client/blob/c9bf1d8e3db3b5fb97faf2df9ca9b9af670288f3/lib/metric.js
export type InternalPromClientMetricInterface = {
    readonly name: string;
    get(): any;
}
