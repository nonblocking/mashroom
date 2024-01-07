
import {setConfig} from '../redis-client';
import healthProbe from '../health/health-probe';
import {registerProviderMetrics, unregisterProviderMetrics} from '../metrics/provider-metrics';
import MashroomMessagingExternalProviderRedis from './MashroomMessagingExternalProviderRedis';

import type {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { internalTopic, client } = pluginConfig;
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

    await setConfig(client);

    const provider = new MashroomMessagingExternalProviderRedis(
        internalTopic, loggerFactory);

    await provider.start();

    healthProbeService.registerProbe(pluginName, healthProbe());
    registerProviderMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        provider.shutdown();
        healthProbeService.unregisterProbe(pluginName);
        unregisterProviderMetrics();
    });

    return provider;
};

export default bootstrap;
