
import {startExportMemoryCacheMetrics, stopExportMemoryCacheMetrics} from '../metrics/memory-cache-metrics';
import MashroomMemoryCacheService from './MashroomMemoryCacheService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {provider, defaultTTLSec} = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const service = new MashroomMemoryCacheService(provider, defaultTTLSec, pluginContext.loggerFactory);

    startExportMemoryCacheMetrics(service, pluginContextHolder);
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopExportMemoryCacheMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
