
import context from '../context';
import healthProbe from '../health/health_probe';
import {startExportRemoteAppMetrics, stopExportRemoteAppMetrics} from '../metrics/remote_app_metrics';

import type {MashroomRemotePortalAppRegistryBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomRemotePortalAppRegistryBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

    healthProbeService.registerProbe(pluginName, healthProbe);
    startExportRemoteAppMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        healthProbeService.unregisterProbe(pluginName);
        stopExportRemoteAppMetrics();
    });

    return context.registry;
};

export default bootstrap;

