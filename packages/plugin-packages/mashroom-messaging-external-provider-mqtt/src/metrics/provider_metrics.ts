
import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomMessagingExternalProviderMQTT} from '../../type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportProviderMetrics = (provider: MashroomMessagingExternalProviderMQTT, pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(async () => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics && pluginContext.services.metrics.service;

        if (collectorService) {
            const client = provider.getClient();
            const connected = client && client.connected ? 1 : 0;

            collectorService.gauge('mashroom_messaging_mqtt_connected', 'Mashroom Messaging MQTT Connected').set(connected);
        }

    }, EXPORT_INTERVAL_MS);
}

export const stopExportProviderMetrics = () => {
    clearInterval(interval);
};
