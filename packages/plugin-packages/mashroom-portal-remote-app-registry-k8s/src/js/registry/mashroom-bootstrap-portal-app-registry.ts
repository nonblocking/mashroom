
import context from '../context';
import healthProbe from '../health/health-probe';
import {registerRemoteAppMetrics, unregisterRemoteAppMetrics} from '../metrics/remote-app-metrics';

import type {MashroomPortalAppRegistryBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppRegistryBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

    healthProbeService.registerProbe(pluginName, healthProbe);
    registerRemoteAppMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        healthProbeService.unregisterProbe(pluginName);
        unregisterRemoteAppMetrics();
    });

    return context.registry;
};

export default bootstrap;

