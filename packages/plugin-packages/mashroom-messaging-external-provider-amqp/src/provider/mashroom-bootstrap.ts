
import healthProbe from '../health/health-probe';
import {registerProviderMetrics, unregisterProviderMetrics} from '../metrics/provider-metrics';
import MashroomMessagingExternalProviderAMQP from './MashroomMessagingExternalProviderAMQP';

import type {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { internalRoutingKey, brokerTopicExchangePrefix, brokerTopicMatchAny, brokerHost, brokerPort, brokerUsername, brokerPassword } = pluginConfig;
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

    const provider = new MashroomMessagingExternalProviderAMQP(internalRoutingKey, brokerTopicExchangePrefix, brokerTopicMatchAny,
        brokerHost, brokerPort, brokerUsername, brokerPassword, loggerFactory);

    provider.start();

    healthProbeService.registerProbe(pluginName, healthProbe(provider));
    registerProviderMetrics(provider, pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        provider.shutdown();
        healthProbeService.unregisterProbe(pluginName);
        unregisterProviderMetrics();
    });

    return provider;
};

export default bootstrap;
