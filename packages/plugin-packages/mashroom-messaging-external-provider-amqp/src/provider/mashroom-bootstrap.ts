
import MashroomMessagingExternalProviderAMQP from './MashroomMessagingExternalProviderAMQP';
import {startExportProviderMetrics, stopExportProviderMetrics} from '../metrics/provider_metrics';

import type {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { internalRoutingKey, brokerTopicExchangePrefix, brokerTopicMatchAny, brokerHost, brokerPort, brokerUsername, brokerPassword } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const provider = new MashroomMessagingExternalProviderAMQP(internalRoutingKey, brokerTopicExchangePrefix, brokerTopicMatchAny,
        brokerHost, brokerPort, brokerUsername, brokerPassword, pluginContext.loggerFactory);

    provider.subscribeToInternalTopic();

    startExportProviderMetrics(provider, pluginContextHolder);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        provider.unsubscribeFromInternalTopic();
        stopExportProviderMetrics();
    });

    return provider;
};

export default bootstrap;
