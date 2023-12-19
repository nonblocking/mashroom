
import {setConfig, close} from '../redis-client';
import healthProbe from '../health/health-probe';
import {startExportProviderMetrics, stopExportProviderMetrics} from '../metrics/provider-metrics';
import MashroomMemoryCacheProviderRedis from './MashroomMemoryCacheProviderRedis';

import type {MashroomMemoryCacheProviderPluginBootstrapFunction} from '@mashroom/mashroom-memory-cache/type-definitions';
import type {IORedisConfig} from '../../type-definitions';

const bootstrap: MashroomMemoryCacheProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} =  pluginContextHolder.getPluginContext();

    await setConfig(pluginConfig as IORedisConfig);

    healthProbeService.registerProbe(pluginName, healthProbe);
    startExportProviderMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        close();
        healthProbeService.unregisterProbe(pluginName);
        stopExportProviderMetrics();
    });

    return new MashroomMemoryCacheProviderRedis(loggerFactory);
};

export default bootstrap;
