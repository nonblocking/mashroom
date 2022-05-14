
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomMessagingExternalProviderAMQP} from '../../type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportProviderMetrics = (provider: MashroomMessagingExternalProviderAMQP, pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            const client = provider.getClient();
            const connected = client && !client.error && client.is_open() ? 1 : 0;

            collectorService.gauge('mashroom_messaging_amqp_connected', 'Mashroom Messaging AMQP Connected').set(connected);
        }

    }, EXPORT_INTERVAL_MS);
};

export const stopExportProviderMetrics = () => {
    clearInterval(interval);
};
