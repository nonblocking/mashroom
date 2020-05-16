
import MashroomMonitoringMetricsCollectorService from './MashroomMonitoringMetricsCollectorService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';
import type {MashroomMonitoringMetricsCollectorConfig} from '../../type-definitions/internal';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const config = pluginConfig as MashroomMonitoringMetricsCollectorConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const service = new MashroomMonitoringMetricsCollectorService(config, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
