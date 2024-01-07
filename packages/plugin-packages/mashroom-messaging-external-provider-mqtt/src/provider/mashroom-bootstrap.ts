
import healthProbe from '../health/health-probe';
import {registerProviderMetrics, unregisterProviderMetrics} from '../metrics/provider-metrics';
import MashroomMessagingExternalProviderMQTT from './MashroomMessagingExternalProviderMQTT';

import type {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { internalTopic, mqttConnectUrl, mqttProtocolVersion, mqttQoS, mqttUser, mqttPassword, rejectUnauthorized } = pluginConfig;
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

    const provider = new MashroomMessagingExternalProviderMQTT(
        internalTopic, mqttConnectUrl, mqttProtocolVersion, mqttQoS,
        mqttUser, mqttPassword, rejectUnauthorized, loggerFactory);

    await provider.start();

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
