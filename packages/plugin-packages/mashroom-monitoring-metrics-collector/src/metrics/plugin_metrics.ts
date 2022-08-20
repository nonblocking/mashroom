
import type {MashroomMonitoringMetricsCollectorService} from '../../type-definitions';
import type {MashroomPluginContextHolder, MashroomPluginService} from '@mashroom/mashroom/type-definitions';

const EXPORT_INTERVAL_MS = 5000;

let interval: NodeJS.Timeout;

export const startExportPluginMetrics = (pluginContextHolder: MashroomPluginContextHolder) => {
    interval = setInterval(() => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const pluginService: MashroomPluginService = pluginContext.services.core.pluginService;
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics.service;

        const pluginsTotal = pluginService.getPlugins().length;
        const pluginsLoaded = pluginService.getPlugins().filter((p) => p.status === 'loaded').length;
        const pluginsError = pluginService.getPlugins().filter((p) => p.status === 'error').length;

        collectorService.gauge('mashroom_plugins_total', 'Mashroom Plugins Total').set(pluginsTotal);
        collectorService.gauge('mashroom_plugins_loaded_total', 'Mashroom Plugins Loaded').set(pluginsLoaded);
        collectorService.gauge('mashroom_plugins_error_total', 'Mashroom Plugins with Status Error').set(pluginsError);

    }, EXPORT_INTERVAL_MS);
};

export const stopExportPluginMetrics = () => {
    clearInterval(interval);
};
