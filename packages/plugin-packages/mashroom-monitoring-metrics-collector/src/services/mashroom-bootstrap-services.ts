
import {registerNodeMetrics} from '../metrics/node-metrics';
import {registerPluginMetrics} from '../metrics/plugin-metrics';
import MashroomMonitoringMetricsCollectorService from './MashroomMonitoringMetricsCollectorService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorConfig} from '../../type-definitions/internal';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const config = pluginConfig as MashroomMonitoringMetricsCollectorConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const service = new MashroomMonitoringMetricsCollectorService(config, pluginContext.loggerFactory);

    registerNodeMetrics(service);
    registerPluginMetrics(service, pluginContextHolder);

    pluginContextHolder.getPluginContext().services.core.pluginService.onUnloadOnce(pluginName, () => {
        service.shutdown();
    });

    return {
        service,
    };
};

export default bootstrap;
