
import healthProbe from '../health/health_probe';
import {startExportProviderMetrics, stopExportProviderMetrics} from '../metrics/provider_metrics';
import MashroomMessagingExternalProviderMQTT from './MashroomMessagingExternalProviderMQTT';

import type {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { internalTopic, mqttConnectUrl, mqttProtocolVersion, mqttQoS, mqttUser, mqttPassword, rejectUnauthorized } = pluginConfig;
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

    const provider = new MashroomMessagingExternalProviderMQTT(
        internalTopic, mqttConnectUrl, mqttProtocolVersion, mqttQoS,
        mqttUser, mqttPassword, rejectUnauthorized, loggerFactory);

    provider.subscribeToInternalTopic();

    healthProbeService.registerProbe(pluginName, healthProbe(provider));
    startExportProviderMetrics(provider, pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        provider.unsubscribeFromInternalTopic();
        healthProbeService.unregisterProbe(pluginName);
        stopExportProviderMetrics();
    });

    return provider;
};

export default bootstrap;
