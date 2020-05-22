
import MashroomMessagingExternalProviderMQTT from './MashroomMessagingExternalProviderMQTT';
import {startExportProviderMetrics, stopExportProviderMetrics} from '../metrics/provider_metrics';

import type {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { internalTopic, mqttConnectUrl, mqttProtocolVersion, mqttQoS, mqttUser, mqttPassword, rejectUnauthorized } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const provider = new MashroomMessagingExternalProviderMQTT(
        internalTopic, mqttConnectUrl, mqttProtocolVersion, mqttQoS,
        mqttUser, mqttPassword, rejectUnauthorized, pluginContext.loggerFactory);

    provider.subscribeToInternalTopic();

    startExportProviderMetrics(provider, pluginContextHolder);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        provider.unsubscribeFromInternalTopic();
        stopExportProviderMetrics();
    });

    return provider;
};

export default bootstrap;
