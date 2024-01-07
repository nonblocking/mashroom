
import type {MashroomMonitoringMetricsCollectorService} from '../../type-definitions';
import type {MashroomPluginContextHolder, MashroomPluginService} from '@mashroom/mashroom/type-definitions';

export const registerPluginMetrics = (collectorService: MashroomMonitoringMetricsCollectorService, pluginContextHolder: MashroomPluginContextHolder) => {
    collectorService.addObservableCallback((asyncCollectorService) => {
        const pluginContext = pluginContextHolder.getPluginContext();
        const pluginService: MashroomPluginService = pluginContext.services.core.pluginService;

        const pluginsTotal = pluginService.getPlugins().length;
        const pluginsLoaded = pluginService.getPlugins().filter((p) => p.status === 'loaded').length;
        const pluginsError = pluginService.getPlugins().filter((p) => p.status === 'error').length;

        asyncCollectorService.gauge('mashroom_plugins_total', 'Mashroom Plugins Total').set(pluginsTotal);
        asyncCollectorService.gauge('mashroom_plugins_loaded_total', 'Mashroom Plugins Loaded').set(pluginsLoaded);
        asyncCollectorService.gauge('mashroom_plugins_error_total', 'Mashroom Plugins with Status Error').set(pluginsError);
    });
};


