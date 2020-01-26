
import MashroomMessagingExternalProviderAMQP from './MashroomMessagingExternalProviderAMQP';

import {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { internalRoutingKey, brokerTopicExchangePrefix, brokerTopicMatchAny, brokerHost, brokerPort, brokerUsername, brokerPassword } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const provider = new MashroomMessagingExternalProviderAMQP(internalRoutingKey, brokerTopicExchangePrefix, brokerTopicMatchAny,
        brokerHost, brokerPort, brokerUsername, brokerPassword, pluginContext.loggerFactory);

    provider.subscribeToInternalTopic();
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        provider.unsubscribeFromInternalTopic();
    });

    return provider;
};

export default bootstrap;
