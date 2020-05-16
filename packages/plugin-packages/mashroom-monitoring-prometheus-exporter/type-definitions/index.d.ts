
import {Registry} from 'prom-client';

export type PrometheusGcStats = (registry: Registry, config?: any) => () => void;
