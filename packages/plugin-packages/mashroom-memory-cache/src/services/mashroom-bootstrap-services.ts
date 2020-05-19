
import MashroomMemoryCacheService from './MashroomMemoryCacheService';
import {startExportMemoryCacheMetrics, stopExportMemoryCacheMetrics} from '../metrics/memory_cache_metrics';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {provider, defaultTTLSec} = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const service = new MashroomMemoryCacheService(provider, defaultTTLSec, pluginContext.loggerFactory);

    startExportMemoryCacheMetrics(service, pluginContextHolder);
    pluginContextHolder.getPluginContext().services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopExportMemoryCacheMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
