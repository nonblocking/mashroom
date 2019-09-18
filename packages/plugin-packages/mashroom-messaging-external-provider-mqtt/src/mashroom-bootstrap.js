// @flow

import MashroomMessagingExternalProviderMQTT from './MashroomMessagingExternalProviderMQTT';

import type {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { internalTopic, mqttConnectUrl, mqttProtocolVersion, mqttQoS, mqttUser, mqttPassword, rejectUnauthorized } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const provider = new MashroomMessagingExternalProviderMQTT(internalTopic, mqttConnectUrl, mqttProtocolVersion, mqttQoS,
        mqttUser, mqttPassword, rejectUnauthorized, pluginContext.loggerFactory);

    provider.subscribeToInternalTopic();
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        provider.unsubscribeFromInternalTopic();
    });

    return provider;
};

export default bootstrap;
