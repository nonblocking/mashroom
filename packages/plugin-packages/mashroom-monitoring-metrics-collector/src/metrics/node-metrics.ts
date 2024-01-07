import setupNodeMetrics from 'opentelemetry-node-metrics';

import type {MashroomMonitoringMetricsCollectorService} from '../../type-definitions';

export const registerNodeMetrics = (collectorService: MashroomMonitoringMetricsCollectorService) => {
    setupNodeMetrics(collectorService.getOpenTelemetryMeterProvider());
};
