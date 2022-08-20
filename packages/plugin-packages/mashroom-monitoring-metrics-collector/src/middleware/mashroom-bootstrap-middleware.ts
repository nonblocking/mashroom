
import {startExportPluginMetrics, stopExportPluginMetrics} from '../metrics/plugin_metrics';
import MashroomMonitoringRequestMetricsMiddleware from './MashroomMonitoringRequestMetricsMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { path } = pluginConfig;

    startExportPluginMetrics(pluginContextHolder);
    pluginContextHolder.getPluginContext().services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopExportPluginMetrics();
    });

    const middleware = new MashroomMonitoringRequestMetricsMiddleware(path);
    return middleware.middleware();
};

export default bootstrap;
